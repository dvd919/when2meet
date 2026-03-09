import { Trophy, TrendingUp, Battery, Scale, AlertCircle, Sparkles, Calendar } from 'lucide-react';
import { useScheduling } from '../src/SchedulingContext';

export function RecommendationPanel() {
  const { recommendations, selectedRecommendation, setSelectedRecommendation, confirmedSlot, setConfirmedSlot } = useScheduling();

  const topRec = recommendations[selectedRecommendation] ?? recommendations[0];

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
    },
    {
      label: 'Fatigue Score',
      value: topRec.metrics.fatigueScore,
      icon: Battery,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      inverse: true,
    },
    {
      label: 'Fairness Score',
      value: topRec.metrics.fairnessScore,
      icon: Scale,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Cancellation Risk',
      value: topRec.metrics.cancellationRisk,
      icon: AlertCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      inverse: true,
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
          <div className="text-blue-100 text-sm">Overall score: {topRec.score}%</div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6 space-y-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{metric.label}</span>
                </div>
                <span className={`text-lg font-semibold ${getScoreColor(metric.value, metric.inverse)}`}>
                  {metric.value}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(metric.value, metric.inverse)}`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900 mb-1 text-sm">AI Insight</div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {getInsight()}
              </p>
            </div>
          </div>
        </div>
      </div>

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
                    <div className="text-xs text-slate-500">Score: {rec.score}%</div>
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
