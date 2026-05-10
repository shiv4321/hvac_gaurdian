import { create } from 'zustand';
import { analyzeAll, type SensorRow, type UnitScore, type Priority } from '../utils/anomalyEngine';
import { getInsight, clearCache, type LLMInsight } from '../utils/llmService';
import rawJson from '../assets/data/hvac_sensor_data.json';

export interface ResolutionEntry {
  unitId: string;
  priority: Priority;
  resolvedAt: string; // ISO string
  note: string;
}

interface HvacState {
  rawData: SensorRow[];
  anomalyResults: UnitScore[];
  insights: Record<string, LLMInsight>;
  insightLoading: Record<string, boolean>;
  lastRefreshed: Date | null;
  resolvedUnits: string[];
  resolutionLog: ResolutionEntry[];

  loadData: (rows: SensorRow[]) => void;
  fetchInsight: (unitId: string) => Promise<void>;
  markResolved: (unitId: string, note?: string) => void;
  markUnresolved: (unitId: string) => void;
}

export const useHvacStore = create<HvacState>((set, get) => ({
  rawData: [],
  anomalyResults: [],
  insights: {},
  insightLoading: {},
  lastRefreshed: null,
  resolvedUnits: [],
  resolutionLog: [],

  loadData(rows) {
    set({
      rawData: rows,
      anomalyResults: analyzeAll(rows),
      lastRefreshed: new Date(),
    });
  },

  async fetchInsight(unitId) {
    const { anomalyResults, insightLoading } = get();
    if (insightLoading[unitId]) return;

    const result = anomalyResults.find((r) => r.unitId === unitId);
    if (!result) return;

    set((s) => ({ insightLoading: { ...s.insightLoading, [unitId]: true } }));
    const insight = await getInsight(result);
    set((s) => ({
      insights: { ...s.insights, [unitId]: insight },
      insightLoading: { ...s.insightLoading, [unitId]: false },
    }));
  },

  markResolved(unitId, note = '') {
    const { anomalyResults } = get();
    const result = anomalyResults.find((r) => r.unitId === unitId);
    clearCache(unitId);
    set((s) => ({
      resolvedUnits: s.resolvedUnits.includes(unitId)
        ? s.resolvedUnits
        : [...s.resolvedUnits, unitId],
      resolutionLog: [
        {
          unitId,
          priority: result?.priority ?? 'OK',
          resolvedAt: new Date().toISOString(),
          note,
        },
        ...s.resolutionLog,
      ],
    }));
  },

  markUnresolved(unitId) {
    set((s) => ({
      resolvedUnits: s.resolvedUnits.filter((id) => id !== unitId),
    }));
  },
}));

useHvacStore.getState().loadData(rawJson as SensorRow[]);
