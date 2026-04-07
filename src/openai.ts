import OpenAI from 'openai';
import type { Recommendation, Participant } from './types';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildSystemPrompt(
  rec: Recommendation,
  totalParticipants: number,
  availableParticipants: Participant[],
  unavailableParticipants: Participant[],
): string {
  const { groupSatisfaction, fatigueScore, fairnessScore, cancellationRisk } = rec.metrics;
  const available = availableParticipants.map(p => p.name).join(', ') || 'none';
  const unavailable = unavailableParticipants.map(p => p.name).join(', ') || 'none';

  return `You are an AI assistant helping analyze a meeting time slot for a group scheduling tool.

Meeting slot: ${rec.day} at ${rec.time} (overall score: ${rec.score}/100)
Participants available (${availableParticipants.length}/${totalParticipants}): ${available}
Participants unavailable: ${unavailable}

Metrics (all 0-100):
- Group satisfaction: ${groupSatisfaction}% — what fraction of participants are available
- Schedule fatigue: ${fatigueScore}% — how packed participants' schedules are around this time (lower is better)
- Fairness score: ${fairnessScore}% — how evenly the scheduling burden is distributed
- Cancellation risk: ${cancellationRisk}% — likelihood someone cancels last-minute (lower is better)

The overall score is a weighted composite: group satisfaction (40%), low fatigue (20%), fairness (25%), low cancellation risk (15%), plus a small bonus for matching preferred time-of-day.

Answer questions concisely and refer to the specific metrics above when relevant. Do not make up data beyond what is provided.`;
}

export async function getAIInsight(
  rec: Recommendation,
  totalParticipants: number,
  availableParticipants: Participant[],
  unavailableParticipants: Participant[] = [],
): Promise<string> {
  const systemPrompt = buildSystemPrompt(rec, totalParticipants, availableParticipants, unavailableParticipants);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Give a concise 2-sentence summary of whether this is a good meeting time and why. Do not use bullet points or headers.' },
    ],
    max_tokens: 120,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

export async function getAIReasoning(
  rec: Recommendation,
  totalParticipants: number,
  availableParticipants: Participant[],
  unavailableParticipants: Participant[],
): Promise<string> {
  const systemPrompt = buildSystemPrompt(rec, totalParticipants, availableParticipants, unavailableParticipants);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'In 3-4 short sentences, explain why this slot received its score. Briefly mention each metric and whether it helped or hurt.' },
    ],
    max_tokens: 150,
    temperature: 0.5,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

export async function chatWithAI(
  rec: Recommendation,
  totalParticipants: number,
  availableParticipants: Participant[],
  unavailableParticipants: Participant[],
  history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  const systemPrompt = buildSystemPrompt(rec, totalParticipants, availableParticipants, unavailableParticipants);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}
