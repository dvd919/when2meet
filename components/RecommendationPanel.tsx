import { Trophy, TrendingUp, Battery, Scale, AlertCircle, Sparkles } from 'lucide-react';

export function RecommendationPanel() {
  const metrics = [
    {
      label: 'Group Satisfaction',
      value: 82,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Fatigue Score',
      value: 28,
      icon: Battery,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      inverse: true,
    },
    {
      label: 'Fairness Score',
      value: 91,
      icon: Scale,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Cancellation Risk',
      value: 40,
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-6">
      {/* Top Recommendation */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-t-xl">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-white" />
          <span className="text-sm font-medium text-blue-100">Top Recommendation</span>
        </div>
        <div className="text-white">
          <div className="text-3xl font-semibold mb-1">Tuesday 3:00 PM</div>
          <div className="text-blue-100 text-sm">February 11, 2026</div>
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
                Lowest schedule strain and balanced compromise. All participants available with minimal back-to-back meetings. 
                Fairness distribution is optimal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 pb-6">
        <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
          Confirm This Time
        </button>
      </div>

      {/* Other Options */}
      <div className="border-t border-slate-200 px-6 py-4">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Other Options</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
            <div>
              <div className="text-sm font-medium text-slate-900">Thursday 2:00 PM</div>
              <div className="text-xs text-slate-500">Score: 78%</div>
            </div>
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              2
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
            <div>
              <div className="text-sm font-medium text-slate-900">Wednesday 10:00 AM</div>
              <div className="text-xs text-slate-500">Score: 74%</div>
            </div>
            <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              3
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
