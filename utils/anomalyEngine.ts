export type SensorRow = Record<string, string | number | null>;

export interface BaselineStat {
  mean: number;
  std: number;
}

export type Baseline = Record<string, Record<string, BaselineStat>>;

export type Priority = 'CRITICAL' | 'WARN' | 'OK';
export type TrendDirection = 'rising' | 'stable';

export interface UnitScore {
  unitId: string;
  priority: Priority;
  combinedZ: number;
  flagged: string[];
  trendDirection: TrendDirection;
  anomalyDurationReadings: number;
  last20Readings: SensorRow[];
}

const IGNORED_COLS = new Set(['timestamp', 'unit_id']);

export function inferSchema(rows: SensorRow[]): string[] {
  if (rows.length === 0) return [];
  const colSet = new Set<string>();
  for (const row of rows) {
    for (const col of Object.keys(row)) colSet.add(col);
  }
  return [...colSet].filter((col) => {
    if (IGNORED_COLS.has(col)) return false;
    return rows.some((row) => {
      const v = row[col];
      return typeof v === 'number' && !isNaN(v);
    });
  });
}

export function buildBaselines(rows: SensorRow[]): Baseline {
  const sensorCols = inferSchema(rows);
  const unitIds = [...new Set(rows.map((r) => String(r['unit_id'])))];
  const baselines: Baseline = {};

  for (const unitId of unitIds) {
    const unitRows = rows.filter((r) => String(r['unit_id']) === unitId);
    baselines[unitId] = {};

    for (const col of sensorCols) {
      const values: number[] = [];
      for (const row of unitRows) {
        const v = row[col];
        if (typeof v === 'number' && !isNaN(v)) values.push(v);
      }

      if (values.length === 0) {
        baselines[unitId][col] = { mean: 0, std: 1 };
        continue;
      }

      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      const variance =
        values.length > 1
          ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)
          : 0;
      const std = Math.sqrt(variance) || 1;
      baselines[unitId][col] = { mean, std };
    }
  }

  return baselines;
}

export function scoreUnit(
  unitId: string,
  rows: SensorRow[],
  baselines: Baseline,
): UnitScore {
  const unitRows = rows.filter((r) => String(r['unit_id']) === unitId);
  const last20 = unitRows.slice(-20);
  const sensorCols = inferSchema(rows);
  const unitBaseline = baselines[unitId] ?? {};

  const sensorAvgZ: Record<string, number> = {};
  for (const col of sensorCols) {
    const baseline = unitBaseline[col];
    if (!baseline) continue;
    const { mean, std } = baseline;
    const zScores: number[] = [];
    for (const row of last20) {
      const v = row[col];
      if (typeof v === 'number' && !isNaN(v)) zScores.push((v - mean) / std);
    }
    if (zScores.length === 0) continue;
    sensorAvgZ[col] = zScores.reduce((s, z) => s + z, 0) / zScores.length;
  }

  const flagged = Object.entries(sensorAvgZ)
    .filter(([, avgZ]) => Math.abs(avgZ) > 2)
    .map(([col]) => col);

  const combinedZ = flagged.reduce((sum, col) => sum + Math.abs(sensorAvgZ[col] ?? 0), 0);
  const multiSensorConfirmed = flagged.length >= 2;

  let priority: Priority;
  if (combinedZ > 8 && multiSensorConfirmed) {
    priority = 'CRITICAL';
  } else if (combinedZ > 4 && multiSensorConfirmed) {
    priority = 'WARN';
  } else {
    priority = 'OK';
  }

  const windowAvgZ = (window: SensorRow[]): number => {
    const zScores: number[] = [];
    for (const col of sensorCols) {
      const baseline = unitBaseline[col];
      if (!baseline) continue;
      const { mean, std } = baseline;
      for (const row of window) {
        const v = row[col];
        if (typeof v === 'number' && !isNaN(v)) zScores.push((v - mean) / std);
      }
    }
    return zScores.length > 0 ? zScores.reduce((s, z) => s + z, 0) / zScores.length : 0;
  };

  const trendDirection: TrendDirection =
    windowAvgZ(last20.slice(-5)) > windowAvgZ(last20.slice(0, 5)) ? 'rising' : 'stable';

  let anomalyDurationReadings = 0;
  for (let i = last20.length - 1; i >= 0; i--) {
    const row = last20[i];
    const isAnomalous = flagged.some((col) => {
      const baseline = unitBaseline[col];
      if (!baseline) return false;
      const v = row[col];
      return typeof v === 'number' && !isNaN(v) && (v - baseline.mean) / baseline.std > 2;
    });
    if (isAnomalous) {
      anomalyDurationReadings++;
    } else {
      break;
    }
  }

  return { unitId, priority, combinedZ, flagged, trendDirection, anomalyDurationReadings, last20Readings: last20 };
}

export function analyzeAll(rows: SensorRow[]): UnitScore[] {
  const unitIds = [...new Set(rows.map((r) => String(r['unit_id'])))];
  const baselines = buildBaselines(rows);
  const scores = unitIds.map((uid) => scoreUnit(uid, rows, baselines));
  const order: Record<Priority, number> = { CRITICAL: 0, WARN: 1, OK: 2 };
  return scores.sort((a, b) => order[a.priority] - order[b.priority]);
}

// ── Test helpers ──────────────────────────────────────────────────────────────

type AnomalyOverrides = {
  temp?: number;
  pressure?: number;
  airflow?: number;
  vibration?: number;
  power?: number;
};

function makeNormalRows(unitId: string, count: number): SensorRow[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: `2026-01-01T${String(i).padStart(8, '0')}Z`,
    unit_id: unitId,
    temp: i % 2 === 0 ? 21 : 23,
    pressure: i % 2 === 0 ? 0.9 : 1.1,
    airflow: i % 2 === 0 ? 280 : 320,
    vibration: i % 2 === 0 ? 0.025 : 0.035,
    power: i % 2 === 0 ? 4.5 : 5.5,
  }));
}

function makeAnomalousRows(unitId: string, overrides: AnomalyOverrides): SensorRow[] {
  return Array.from({ length: 20 }, (_, i) => ({
    timestamp: `2026-01-02T${String(i).padStart(8, '0')}Z`,
    unit_id: unitId,
    temp: overrides.temp ?? (i % 2 === 0 ? 21 : 23),
    pressure: overrides.pressure ?? (i % 2 === 0 ? 0.9 : 1.1),
    airflow: overrides.airflow ?? (i % 2 === 0 ? 280 : 320),
    vibration: overrides.vibration ?? (i % 2 === 0 ? 0.025 : 0.035),
    power: overrides.power ?? (i % 2 === 0 ? 4.5 : 5.5),
  }));
}

export function runTest(): void {
  // Baselines: 1000 alternating normal rows → mean=midpoint, std=half-amplitude.
  // Anomalous last 20 rows are appended; 2% contamination barely shifts mean/std.
  //
  // Expected combinedZ (approximate):
  //   HVAC_1: temp≈4.05 + pressure≈4.55 = 8.60 → CRITICAL
  //   HVAC_2: temp≈3.45 + pressure≈3.46 + vibration≈4.05 = 10.96 → CRITICAL
  //   HVAC_3: temp≈2.34 + pressure≈2.34 = 4.68 → WARN
  //   HVAC_4/5: all normal, no flags → OK

  const rows: SensorRow[] = [
    ...makeNormalRows('HVAC_1', 1000),
    ...makeAnomalousRows('HVAC_1', { temp: 27, pressure: 1.6 }),

    ...makeNormalRows('HVAC_2', 1000),
    ...makeAnomalousRows('HVAC_2', { temp: 26, pressure: 1.4, vibration: 0.055 }),

    ...makeNormalRows('HVAC_3', 1000),
    ...makeAnomalousRows('HVAC_3', { temp: 24.5, pressure: 1.25 }),

    ...makeNormalRows('HVAC_4', 1020),

    ...makeNormalRows('HVAC_5', 1020),
  ];

  const results = analyzeAll(rows);

  console.log('=== HVAC Anomaly Engine Test Results ===\n');
  for (const r of results) {
    console.log(`Unit: ${r.unitId}`);
    console.log(`  Priority:         ${r.priority}`);
    console.log(`  CombinedZ:        ${r.combinedZ.toFixed(3)}`);
    console.log(`  Flagged sensors:  ${r.flagged.join(', ') || 'none'}`);
    console.log(`  Trend:            ${r.trendDirection}`);
    console.log(`  Anomaly duration: ${r.anomalyDurationReadings} readings`);
    console.log('');
  }
}
