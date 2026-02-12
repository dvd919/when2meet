import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface Participant {
  name: string;
  color: string;
}

interface Recommendation {
  day: string;
  time: string;
  dayIndex: number;
  timeIndex: number;
}

interface WeeklyCalendarProps {
  topRecommendations: Recommendation[];
  participants: Participant[];
}

export function WeeklyCalendar({ topRecommendations, participants }: WeeklyCalendarProps) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8am to 9pm
  
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Mock availability data (0-5 people available)
  const getAvailability = (dayIndex: number, hour: number): number => {
    const patterns: Record<number, number[]> = {
      0: [2, 3, 4, 3, 2, 3, 4, 3, 2, 1, 2, 3, 2, 1], // Monday
      1: [3, 4, 4, 2, 1, 2, 5, 4, 3, 2, 3, 4, 3, 2], // Tuesday
      2: [2, 3, 5, 3, 2, 3, 4, 3, 2, 3, 4, 3, 2, 1], // Wednesday
      3: [3, 4, 3, 2, 3, 4, 5, 4, 3, 2, 3, 2, 1, 1], // Thursday
      4: [2, 3, 4, 3, 2, 3, 4, 3, 4, 3, 2, 3, 2, 1], // Friday
      5: [1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 0], // Saturday
      6: [1, 2, 2, 1, 2, 3, 2, 1, 2, 1, 2, 1, 0, 0], // Sunday
    };
    
    return patterns[dayIndex]?.[hour - 8] || 0;
  };

  // Check if cell has fatigue risk
  const hasFatigueRisk = (dayIndex: number, hour: number): boolean => {
    return (dayIndex === 1 && hour === 14) || (dayIndex === 3 && hour === 16) || (dayIndex === 4 && hour === 17);
  };

  const getRankForCell = (dayIndex: number, hour: number): number | null => {
    const rec = topRecommendations.findIndex(
      r => r.dayIndex === dayIndex && r.timeIndex === hour - 8
    );
    return rec !== -1 ? rec + 1 : null;
  };

  const getOpacityClass = (count: number): string => {
    if (count === 0) return 'opacity-0';
    if (count === 1) return 'opacity-20';
    if (count === 2) return 'opacity-40';
    if (count === 3) return 'opacity-60';
    if (count === 4) return 'opacity-80';
    return 'opacity-100';
  };

  const formatHour = (hour: number): string => {
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
        <h2 className="font-semibold text-slate-900">Weekly Availability Heatmap</h2>
        <p className="text-sm text-slate-600 mt-1">February 10-16, 2026</p>
      </div>

      <div className="p-6 overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {/* Header Row */}
            <div className="bg-slate-100 p-3" />
            {days.map((day) => (
              <div
                key={day}
                className="bg-slate-100 p-3 text-center font-medium text-slate-700 text-sm"
              >
                <div>{day.substring(0, 3)}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Feb {10 + days.indexOf(day)}
                </div>
              </div>
            ))}

            {/* Time Rows */}
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="bg-slate-50 p-3 text-sm font-medium text-slate-600 flex items-center">
                  {formatHour(hour)}
                </div>
                {days.map((day, dayIndex) => {
                  const count = getAvailability(dayIndex, hour);
                  const hasFatigue = hasFatigueRisk(dayIndex, hour);
                  const rank = getRankForCell(dayIndex, hour);
                  const key = `${dayIndex}-${hour}`;
                  const isHovered = hoveredCell === key;

                  return (
                    <div
                      key={key}
                      className={`bg-white p-3 min-h-[60px] relative cursor-pointer transition-all group ${
                        isHovered ? 'ring-2 ring-blue-500 ring-inset z-10' : ''
                      }`}
                      onMouseEnter={() => setHoveredCell(key)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {/* Availability Gradient */}
                      {count > 0 && (
                        <div 
                          className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 ${getOpacityClass(count)}`}
                        />
                      )}

                      {/* Content */}
                      <div className="relative z-10 flex flex-col items-center justify-center h-full">
                        {/* Rank Badge */}
                        {rank && (
                          <div className={`
                            w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg mb-1
                            ${rank === 1 ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' : ''}
                            ${rank === 2 ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white' : ''}
                            ${rank === 3 ? 'bg-gradient-to-br from-slate-600 to-slate-700 text-white' : ''}
                          `}>
                            {rank}
                          </div>
                        )}

                        {/* Availability Count */}
                        {count > 0 && !rank && (
                          <div className="text-xs font-semibold text-white drop-shadow-md">
                            {count}/{participants.length}
                          </div>
                        )}

                        {/* Fatigue Warning */}
                        {hasFatigue && (
                          <div className="absolute top-1 right-1">
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                              <AlertTriangle className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hover Tooltip */}
                      {isHovered && count > 0 && (
                        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-20 shadow-xl">
                          <div className="font-semibold">{day} {formatHour(hour)}</div>
                          <div className="text-slate-300 mt-0.5">{count} of {participants.length} available</div>
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded" />
            <span className="text-slate-600">High availability</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-500 opacity-40 rounded" />
            <span className="text-slate-600">Low availability</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <span className="text-slate-600">AI recommendation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-slate-600">Fatigue risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
