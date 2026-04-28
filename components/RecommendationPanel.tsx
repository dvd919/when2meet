import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Battery, Scale, AlertCircle, Sparkles, Calendar, UserPlus } from 'lucide-react';
import { useScheduling } from '../src/SchedulingContext';
import { getAIInsight } from '../src/openai';
import { MetricInfo } from './MetricInfo';

export function RecommendationPanel() {
  const {
    recommendations,
    selectedRecommendation,
    setSelectedRecommendation,
    confirmedSlot,
    setConfirmedSlot,
    participants,
    availabilities,
    preferences,
    meetingConfig,
    getAvailableParticipants,
    computeWhatIf,
  } = useScheduling();
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const topRec = recommendations[selectedRecommendation] ?? recommendations[0];

  useEffect(() => {
    if (!topRec || !meetingConfig) return;
    setAiInsight('');
    setAiLoading(true);
    getAIInsight({
      meetingConfig,
      participants,
      availabilities,
      preferences,
      recommendations,
      activeRec: topRec,
    })
      .then(setAiInsight)
      .catch(() => setAiInsight(''))
      .finally(() => setAiLoading(false));
  }, [topRec?.dayIndex, topRec?.timeIndex, topRec?.score]);

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-6">
        <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-6 rounded-t-xl">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-white" />
            <span className="text-sm font-medium text-slate-200">No Recommendations Yet</span>
          </div>
          <div className="text-white">
            <div className="text-xl font-semibold mb-1">Mark your availability</div>
            <div className="text-slate-300 text-sm">Click on time slots in the calendar to get started</div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Click or drag on the weekly calendar to mark when you're available.
            The AI will analyze all participants' schedules and recommend the best meeting times.
          </p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Group Satisfaction',
      value: topRec.metrics.groupSatisfaction,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      info: {
        title: 'Group Satisfaction',
        description: 'Percent of participants who marked themselves available at this slot.',
        formula: '(available / total) × 100',
      },
      align: 'left' as const,
    },
    {
      label: 'Fatigue Score',
      value: topRec.metrics.fatigueScore,
      icon: Battery,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      inverse: true,
      info: {
        title: 'Fatigue Score',
        description: 'For participants available at this slot, the average length of their consecutive available block on this day. Long uninterrupted blocks suggest schedule strain.',
        formula: 'avg(consecutive available hrs) ÷ 8 × 100',
        note: 'Lower is better. Capped at 100.',
      },
      align: 'right' as const,
    },
    {
      label: 'Fairness Score',
      value: topRec.metrics.fairnessScore,
      icon: Scale,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      info: {
        title: 'Fairness Score',
        description: 'How evenly the "be available" burden is split. High when participants are uniform at this slot (all in or all out), low when the group is split.',
        formula: '100 − stdDev(sacrifices) × 2.5',
        note: 'Each unavailable person counts as a sacrifice of 100; available counts as 0.',
      },
      align: 'left' as const,
    },
    {
      label: 'Cancellation Risk',
      value: topRec.metrics.cancellationRisk,
      icon: AlertCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      inverse: true,
      info: {
        title: 'Cancellation Risk',
        description: 'Estimated chance someone will not show. Driven mostly by who is unavailable, with a smaller boost from fatigue.',
        formula: '(1 − available/total) × 60 + Fatigue × 0.4',
        note: 'Lower is better.',
      },
      align: 'right' as const,
    },
  ];

  const getScoreColor = (value: number, inverse: boolean = false): string => {
    const score = inverse ? 100 - value : value;
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getBarColor = (value: number, inverse: boolean = false): string => {
    const score = inverse ? 100 - value : value;
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const isConfirmed = confirmedSlot?.dayIndex === topRec.dayIndex && confirmedSlot?.hourIndex === topRec.timeIndex;

  const getInsight = (): string => {
    const { groupSatisfaction, fatigueScore, fairnessScore } = topRec.metrics;
    const parts: string[] = [];
    if (groupSatisfaction >= 80) parts.push('Excellent group availability');
    else if (groupSatisfaction >= 60) parts.push('Good group availability');
    else parts.push('Moderate group availability');

    if (fatigueScore <= 30) parts.push('low schedule strain');
    else if (fatigueScore <= 60) parts.push('moderate schedule strain');
    else parts.push('high schedule strain — consider alternatives');

    if (fairnessScore >= 80) parts.push('balanced compromise across all participants');
    else if (fairnessScore >= 60) parts.push('reasonable fairness distribution');
    else parts.push('some participants may be disproportionately impacted');

    return parts.join('. ') + '.';
  };

  const availableNow = getAvailableParticipants(topRec.dayIndex, topRec.timeIndex);
  const unavailableParticipants = participants
    .map((p, i) => ({ participant: p, index: i }))
    .filter(({ participant }) => !availableNow.find(a => a.name === participant.name))
    .map(({ participant, index }) => ({
      participant,
      whatIfScore: computeWhatIf(topRec.dayIndex, topRec.timeIndex, index),
      delta: computeWhatIf(topRec.dayIndex, topRec.timeIndex, index) - topRec.score,
    }))
    .filter(({ delta }) => delta > 0)
    .sort((a, b) => b.delta - a.delta);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-6">
      {/* Top Recommendation */}
      <div className={`p-6 rounded-t-xl ${isConfirmed ? 'bg-gradient-to-br from-green-600 to-emerald-600' : 'bg-gradient-to-br from-blue-600 to-purple-600'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-white" />
          <span className="text-sm font-medium text-blue-100">
            {isConfirmed ? 'Confirmed!' : `#${selectedRecommendation + 1} Recommendation`}
          </span>
        </div>
        <div className="text-white">
          <div className="text-3xl font-semibold mb-1">{topRec.day} {topRec.time}</div>
          <div className="text-blue-100 text-sm flex items-center gap-1.5">
            <span>Overall score: {topRec.score}/100</span>
            <span className="text-white/70 hover:text-white">
              <MetricInfo
                align="left"
                title="Overall Score"
                description="Weighted blend of the four metrics below, plus a small bonus when the time-of-day matches your ideal preference."
                formula="0.4 × Satisfaction + 0.2 × (100 − Fatigue) + 0.25 × Fairness + 0.15 × (100 − Risk) + timeBonus"
                note="Importance preference scales Satisfaction (0.7×–1.5×). Flexibility scales Fairness (0.5×–1.5×). Capped at 100."
              />
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className={`rounded-lg p-3 ${metric.bgColor}`}>
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-3.5 h-3.5 ${metric.color}`} />
                <span className={`text-sm font-bold ${getScoreColor(metric.value, metric.inverse)}`}>
                  {metric.value}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(metric.value, metric.inverse)}`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
              <div className="text-xs text-slate-600 font-medium flex items-center gap-1">
                <span>{metric.label}</span>
                <MetricInfo
                  title={metric.info.title}
                  description={metric.info.description}
                  formula={metric.info.formula}
                  note={metric.info.note}
                  align={metric.align}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-white rounded-lg shadow-sm flex-shrink-0">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900 mb-1 text-sm">AI Insight</div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {aiLoading ? 'Analyzing...' : aiInsight || getInsight()}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Have a question? Tap <span className="font-semibold">Ask AI</span> in the bottom-right.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What-if Analysis */}
      {unavailableParticipants.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <UserPlus className="w-4 h-4 text-amber-600" />
              </div>
              <div className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                <span>What-if Analysis</span>
                <MetricInfo
                  align="left"
                  title="What-if Analysis"
                  description="Pretends a currently unavailable participant joins this slot, recomputes the overall score, and shows the change."
                  note="Only participants whose joining would increase the overall score are listed."
                />
              </div>
            </div>
            <div className="space-y-2">
              {unavailableParticipants.map(({ participant, whatIfScore, delta }) => (
                <div key={participant.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: participant.color }} />
                    <span className="text-sm text-slate-700">
                      If <span className="font-medium">{participant.name}</span> joined
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="text-slate-400">score {topRec.score}</span>
                    <span className="text-slate-300">→</span>
                    <span className="text-green-600">{whatIfScore}</span>
                    <span className="text-xs text-green-600">(+{delta})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="px-6 pb-6">
        {isConfirmed ? (
          <button
            onClick={() => setConfirmedSlot(null)}
            className="w-full py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-all"
          >
            Cancel Confirmation
          </button>
        ) : (
          <button
            onClick={() => setConfirmedSlot({ dayIndex: topRec.dayIndex, hourIndex: topRec.timeIndex })}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            Confirm This Time
          </button>
        )}
      </div>

      {/* Other Options */}
      {recommendations.length > 1 && (
        <div className="border-t border-slate-200 px-6 py-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Other Options</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recommendations.slice(0, 6).map((rec, i) => {
              if (i === selectedRecommendation) return null;
              const rankColors = [
                'bg-blue-600', 'bg-purple-600', 'bg-slate-600',
                'bg-slate-500', 'bg-slate-400', 'bg-slate-400',
              ];
              return (
                <div
                  key={`${rec.dayIndex}-${rec.timeIndex}`}
                  onClick={() => setSelectedRecommendation(i)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    i === selectedRecommendation ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">{rec.day} {rec.time}</div>
                    <div className="text-xs text-slate-500">Score: {rec.score}/100</div>
                  </div>
                  <div className={`w-6 h-6 ${rankColors[i]} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                    {i + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
