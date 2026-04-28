import OpenAI from 'openai';
import type {
  Recommendation,
  Participant,
  Preferences,
  MeetingConfig,
  AvailabilityGrid,
} from './types';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MeetingPromptContext {
  meetingConfig: MeetingConfig;
  participants: Participant[];
  availabilities: AvailabilityGrid[];
  preferences: Preferences;
  recommendations: Recommendation[];
  activeRec: Recommendation;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function formatHourLabel(hourIndex: number): string {
  const h = hourIndex + 8;
  if (h === 12) return '12pm';
  if (h > 12) return `${h - 12}pm`;
  if (h === 0) return '12am';
  return `${h}am`;
}

function formatAvailability(
  participants: Participant[],
  availabilities: AvailabilityGrid[],
  cfg: MeetingConfig,
): string {
  const lines: string[] = [];
  participants.forEach((p, i) => {
    const grid = availabilities[i];
    const dayLines: string[] = [];
    for (const d of cfg.days) {
      const slots: string[] = [];
      for (let h = cfg.startHour; h <= cfg.endHour; h++) {
        if (grid?.[d]?.[h]) slots.push(formatHourLabel(h));
      }
      if (slots.length > 0) dayLines.push(`  ${DAY_NAMES[d]}: ${slots.join(', ')}`);
    }
    lines.push(`- ${p.name}:`);
    lines.push(dayLines.length === 0 ? '    (no availability marked)' : dayLines.join('\n'));
  });
  return lines.join('\n');
}

function formatRecommendations(recs: Recommendation[], activeIndex: number): string {
  return recs
    .slice(0, 8)
    .map((r, i) => {
      const marker = i === activeIndex ? ' (active)' : '';
      const m = r.metrics;
      return `${i + 1}. ${r.day} ${r.time} — score ${r.score}${marker}; satisfaction=${m.groupSatisfaction}, fatigue=${m.fatigueScore}, fairness=${m.fairnessScore}, risk=${m.cancellationRisk}`;
    })
    .join('\n');
}

function buildSystemPrompt(ctx: MeetingPromptContext): string {
  const { meetingConfig, participants, availabilities, preferences, recommendations, activeRec } = ctx;
  const total = participants.length;

  const available = participants.filter(
    (_, i) => availabilities[i]?.[activeRec.dayIndex]?.[activeRec.timeIndex],
  );
  const unavailable = participants.filter(
    (_, i) => !availabilities[i]?.[activeRec.dayIndex]?.[activeRec.timeIndex],
  );
  const availableNames = available.map((p) => p.name).join(', ') || 'none';
  const unavailableNames = unavailable.map((p) => p.name).join(', ') || 'none';

  const activeRank = recommendations.findIndex(
    (r) => r.dayIndex === activeRec.dayIndex && r.timeIndex === activeRec.timeIndex,
  );

  return `You are an AI assistant for a group scheduling tool. You have full access to the meeting state below and should use it to answer questions concretely. Cite specific days, times, names, and numbers from the data. Do not invent details.

# Meeting
Name: ${meetingConfig.name}
Description: ${meetingConfig.description || '(none)'}
Considered days: ${meetingConfig.days.map((d) => DAY_NAMES[d]).join(', ')}
Hour range: ${formatHourLabel(meetingConfig.startHour)} to ${formatHourLabel(meetingConfig.endHour)}
Total participants: ${total}

# Active slot under discussion
${activeRec.day} ${activeRec.time} — overall score ${activeRec.score}/100 (rank #${activeRank + 1})
Available (${available.length}/${total}): ${availableNames}
Unavailable: ${unavailableNames}
Slot metrics (0–100):
- Group satisfaction: ${activeRec.metrics.groupSatisfaction}% — fraction of participants available
- Schedule fatigue: ${activeRec.metrics.fatigueScore}% — avg length of surrounding availability block (lower is better)
- Fairness: ${activeRec.metrics.fairnessScore}% — uniformity of who is/isn't available
- Cancellation risk: ${activeRec.metrics.cancellationRisk}% — likelihood someone cancels (lower is better)

# Top recommendations (sorted by overall score)
${formatRecommendations(recommendations, activeRank)}

# Each participant's marked availability
${formatAvailability(participants, availabilities, meetingConfig)}

# User preferences (these adjust the overall score)
- Importance: ${preferences.importance} — scales group satisfaction weight (high=1.5×, medium=1.0×, low=0.7×)
- Flexibility: ${preferences.flexibility} — scales fairness weight (high=0.5×, medium=1.0×, low=1.5×)
- Ideal time: ${preferences.idealTime} — slots in this band get a +10 bonus (morning=8–11am, afternoon=12–4pm, evening=5–9pm)

# Scoring formula
overall = 0.4 × satisfaction × importanceWeight
       + 0.2 × (100 − fatigue)
       + 0.25 × fairness × flexibilityWeight
       + 0.15 × (100 − cancellationRisk)
       + timeBonus     (capped at 100)

# Answer style
- Be concise: 1–3 short sentences unless the question genuinely needs more.
- Reference specific days, times, names, and numbers from above.
- If asked about a slot not in the top recommendations, reason from the availability grid.
- If asked about hypothetical changes, reason from the formula and the grid.
- Do not invent data not provided.`;
}

export async function getAIInsight(ctx: MeetingPromptContext): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content:
          'Give a concise 2-sentence summary of whether this is a good meeting time and why. Do not use bullet points or headers.',
      },
    ],
    max_tokens: 120,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

export async function getAIReasoning(ctx: MeetingPromptContext): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content:
          'In 3-4 short sentences, explain why this slot received its score. Briefly mention each metric and whether it helped or hurt.',
      },
    ],
    max_tokens: 150,
    temperature: 0.5,
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

export async function chatWithAI(
  ctx: MeetingPromptContext,
  history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx);

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
