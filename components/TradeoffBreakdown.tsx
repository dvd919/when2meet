import { BarChart3 } from 'lucide-react';

export function TradeoffBreakdown() {
  const tradeoffs = [
    {
      label: 'Energy Level',
      participants: [
        { name: 'You', value: 85, color: '#3B82F6' },
        { name: 'Alex', value: 72, color: '#8B5CF6' },
        { name: 'Jordan', value: 90, color: '#EC4899' },
        { name: 'Sam', value: 78, color: '#10B981' },
        { name: 'Casey', value: 68, color: '#F59E0B' },
      ],
    },
    {
      label: 'Back-to-back Meetings',
      participants: [
        { name: 'You', value: 25, color: '#3B82F6', inverse: true },
        { name: 'Alex', value: 60, color: '#8B5CF6', inverse: true },
        { name: 'Jordan', value: 15, color: '#EC4899', inverse: true },
        { name: 'Sam', value: 40, color: '#10B981', inverse: true },
        { name: 'Casey', value: 55, color: '#F59E0B', inverse: true },
      ],
    },
    {
      label: 'Meeting Importance Weight',
      participants: [
        { name: 'You', value: 80, color: '#3B82F6' },
        { name: 'Alex', value: 90, color: '#8B5CF6' },
        { name: 'Jordan', value: 75, color: '#EC4899' },
        { name: 'Sam', value: 85, color: '#10B981' },
        { name: 'Casey', value: 70, color: '#F59E0B' },
      ],
    },
    {
      label: 'Fairness Distribution',
      participants: [
        { name: 'You', value: 88, color: '#3B82F6' },
        { name: 'Alex', value: 65, color: '#8B5CF6' },
        { name: 'Jordan', value: 92, color: '#EC4899' },
        { name: 'Sam', value: 95, color: '#10B981' },
        { name: 'Casey', value: 82, color: '#F59E0B' },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900">Tradeoff Breakdown</h3>
        </div>
        <p className="text-sm text-slate-600 mt-1">Impact analysis for Tuesday 3:00 PM</p>
      </div>

      <div className="p-6 space-y-6">
        {tradeoffs.map((tradeoff) => (
          <div key={tradeoff.label}>
            <div className="text-sm font-medium text-slate-700 mb-3">{tradeoff.label}</div>
            <div className="space-y-2">
              {tradeoff.participants.map((participant) => (
                <div key={participant.name} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-slate-600">{participant.name}</div>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${participant.value}%`,
                        backgroundColor: participant.color,
                      }}
                    />
                  </div>
                  <div className="w-10 text-sm font-medium text-slate-700 text-right">
                    {participant.value}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
