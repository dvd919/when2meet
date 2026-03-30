import OpenAI from 'openai';
import type { Recommendation, Participant } from './types';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function getAIInsight(
  rec: Recommendation,
  totalParticipants: number,
  availableParticipants: Participant[],
): Promise<string> {
  const unavailable = totalParticipants - availableParticipants.length;
  const { groupSatisfaction, fatigueScore, fairnessScore, cancellationRisk } = rec.metrics;

  const prompt = `You are analyzing a meeting time slot for a group scheduling tool.

Slot: ${rec.day} at ${rec.time} (overall score: ${rec.score}%)
Available: ${availableParticipants.length} of ${totalParticipants} participants${unavailable > 0 ? ` (${unavailable} unavailable)` : ''}
Metrics:
- Group satisfaction: ${groupSatisfaction}%
- Schedule fatigue: ${fatigueScore}% (lower is better)
- Fairness score: ${fairnessScore}%
- Cancellation risk: ${cancellationRisk}% (lower is better)

Write a concise 2-sentence insight explaining whether this time slot is a good choice and why, referencing the specific metrics. Do not use bullet points or headers.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 120,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}
