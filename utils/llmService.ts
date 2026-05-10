import type { UnitScore } from './anomalyEngine';

export type Urgency = 'inspect-immediately' | 'inspect-this-shift' | 'monitor';

export interface LLMInsight {
  reason: string;
  likelyCause: string;
  urgency: Urgency;
  recommendedAction: string;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const READINGS_TO_MINUTES = 5;

const cache = new Map<string, LLMInsight>();

function buildPrompt(result: UnitScore): string {
  const { unitId, combinedZ, flagged, trendDirection, anomalyDurationReadings, last20Readings } = result;
  const last10 = last20Readings.slice(-10);
  const minutes = anomalyDurationReadings * READINGS_TO_MINUTES;

  return (
    'You are an HVAC diagnostic AI for factory floor technicians. ' +
    'Respond ONLY with valid JSON — no markdown fences, no extra text.\n\n' +
    `Unit: ${unitId}\n` +
    `Anomaly score: ${combinedZ.toFixed(2)}\n` +
    `Sensors flagged: ${flagged.join(', ')}\n` +
    `Trend: ${trendDirection}\n` +
    `Duration: ${anomalyDurationReadings} readings (~${minutes} min)\n` +
    `Last 10 readings: ${JSON.stringify(last10)}\n\n` +
    'Return exactly this JSON shape:\n' +
    '{"reason":"2 sentences citing specific sensor values","likelyCause":"short phrase",' +
    '"urgency":"inspect-immediately|inspect-this-shift|monitor","recommendedAction":"1 actionable sentence for a technician"}'
  );
}

function fallback(unitId: string): LLMInsight {
  return {
    reason: `Anomaly detected on unit ${unitId}. Diagnostic insight unavailable at this time.`,
    likelyCause: 'Unknown — manual inspection required',
    urgency: 'inspect-this-shift',
    recommendedAction: 'Inspect the unit manually and check sensor readings on-site.',
  };
}

function getApiKey() {
  return (
    process.env.EXPO_PUBLIC_GROQ_API_KEY ??
    process.env.EXPO_GROQ_API_KEY ??
    process.env.EXPO_open_ai_key
  );
}

function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

export async function getInsight(result: UnitScore): Promise<LLMInsight> {
  const { unitId } = result;

  if (cache.has(unitId)) return cache.get(unitId)!;

  const apiKey = getApiKey();
  if (!apiKey) {
    return fallback(unitId);
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [{ role: 'user', content: buildPrompt(result) }],
      }),
    });

    if (!response.ok) {
      return fallback(unitId);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const raw = stripFences(data.choices?.[0]?.message?.content ?? '');
    const insight = JSON.parse(raw) as LLMInsight;

    if (!insight.reason || !insight.likelyCause || !insight.urgency || !insight.recommendedAction) {
      throw new Error('incomplete response');
    }

    cache.set(unitId, insight);
    return insight;
  } catch {
    return fallback(unitId);
  }
}

export function clearCache(unitId: string): void {
  cache.delete(unitId);
}

export function clearAllCache(): void {
  cache.clear();
}
