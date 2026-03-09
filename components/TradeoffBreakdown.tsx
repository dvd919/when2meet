import { BarChart3 } from 'lucide-react';
import { useScheduling } from '../src/SchedulingContext';

export function TradeoffBreakdown() {
  const { participants, recommendations, selectedRecommendation, availabilities } = useScheduling();

  const topRec = recommendations[selectedRecommendation] ?? recommendations[0];

  if (!topRec) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-700" />
            <h3 className="font-semibold text-slate-900">Tradeoff Breakdown</h3>
          </div>
        </div>
        <div className="p-6 text-sm text-slate-500">
          Mark your availability to see per-participant analysis.
        </div>
      </div>
    );
  }

  const { dayIndex, timeIndex } = topRec;

  // Compute per-participant metrics for the selected slot
  const computeEnergyLevel = (pIndex: number): number => {
    const hour = timeIndex + 8;
    // Simulate: morning people have more energy early, etc.
    // Base energy is higher mid-morning, dips after lunch
    let base = 80;
    if (hour >= 8 && hour <= 10) base = 85;
    else if (hour >= 11 && hour <= 13) base = 75;
    else if (hour >= 14 && hour <= 16) base = 70;
    else if (hour >= 17) base = 60;
    // Vary by participant
    const offsets = [5, -8, 10, -2, -12];
    return Math.max(20, Math.min(100, base + offsets[pIndex]));
  };

  const computeBackToBack = (pIndex: number): number => {
    const grid = availabilities[pIndex];
    let consecutive = 0;
    for (let h = timeIndex - 1; h >= 0; h--) {
      if (grid[dayIndex][h]) consecutive++;
      else break;
    }
    for (let h = timeIndex + 1; h < 14; h++) {
      if (grid[dayIndex][h]) consecutive++;
      else break;
    }
    // Normalize: 0 = 0%, 8+ = 100%
    return Math.round(Math.min(100, (consecutive / 8) * 100));
  };

  const computeFairness = (pIndex: number): number => {
    // How often this person is available vs others
    const grid = availabilities[pIndex];
    let totalAvail = 0;
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 14; h++) {
        if (grid[d][h]) totalAvail++;
      }
    }
    // More availability = higher fairness (they have more flexibility)
    return Math.round(Math.min(100, (totalAvail / 50) * 100));
  };

  const tradeoffs = [
    {
      label: 'Energy Level',
      participants: participants.map((p, i) => ({
        name: p.name,
        value: computeEnergyLevel(i),
        color: p.color,
      })),
    },
    {
      label: 'Back-to-back Meetings',
      participants: participants.map((p, i) => ({
        name: p.name,
        value: computeBackToBack(i),
        color: p.color,
        inverse: true,
      })),
    },
    {
      label: 'Availability (Available)',
      participants: participants.map((p, i) => ({
        name: p.name,
        value: availabilities[i][dayIndex][timeIndex] ? 100 : 0,
        color: p.color,
      })),
    },
    {
      label: 'Schedule Flexibility',
      participants: participants.map((p, i) => ({
        name: p.name,
        value: computeFairness(i),
        color: p.color,
      })),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900">Tradeoff Breakdown</h3>
        </div>
        <p className="text-sm text-slate-600 mt-1">Impact analysis for {topRec.day} {topRec.time}</p>
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
