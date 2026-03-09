import { AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';
import { useScheduling } from '../src/SchedulingContext';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function WeeklyCalendar() {
  const {
    participants,
    recommendations,
    toggleAvailability,
    setDragMode,
    dragMode,
    handleDragOver,
    getAvailabilityCount,
    getAvailableParticipants,
    availabilities,
    confirmedSlot,
    meetingConfig,
  } = useScheduling();

  const days = meetingConfig ? meetingConfig.days : [0, 1, 2, 3, 4, 5, 6];
  const startHour = meetingConfig?.startHour ?? 0;
  const endHour = meetingConfig?.endHour ?? 13;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const getRankForCell = (dayIndex: number, hourIndex: number): number | null => {
    const top3 = recommendations.slice(0, 3);
    const idx = top3.findIndex(r => r.dayIndex === dayIndex && r.timeIndex === hourIndex);
    return idx !== -1 ? idx + 1 : null;
  };

  const hasFatigueRisk = (dayIndex: number, hourIndex: number): boolean => {
    for (let p = 0; p < participants.length; p++) {
      if (!availabilities[p]?.[dayIndex]?.[hourIndex]) continue;
      let consecutive = 1;
      for (let h = hourIndex - 1; h >= 0; h--) {
        if (availabilities[p][dayIndex][h]) consecutive++;
        else break;
      }
      for (let h = hourIndex + 1; h < 14; h++) {
        if (availabilities[p][dayIndex][h]) consecutive++;
        else break;
      }
      if (consecutive >= 5) return true;
    }
    return false;
  };

  const getOpacityClass = (count: number): string => {
    if (count === 0) return 'opacity-0';
    if (count === 1) return 'opacity-20';
    if (count === 2) return 'opacity-40';
    if (count === 3) return 'opacity-60';
    if (count === 4) return 'opacity-80';
    return 'opacity-100';
  };

  const formatHour = (hourIndex: number): string => {
    const hour = hourIndex + 8;
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  const isConfirmed = (dayIndex: number, hourIndex: number): boolean => {
    return confirmedSlot?.dayIndex === dayIndex && confirmedSlot?.hourIndex === hourIndex;
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden select-none"
      onMouseUp={() => setDragMode(null)}
      onMouseLeave={() => setDragMode(null)}
    >
      <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
        <h2 className="font-semibold text-slate-900">Weekly Availability Heatmap</h2>
        <p className="text-sm text-slate-600 mt-1">Click or drag on slots to mark your availability</p>
      </div>

      <div className="p-6 overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className={`grid gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden`} style={{
            gridTemplateColumns: `100px repeat(${days.length}, 1fr)`,
          }}>
            {/* Header Row */}
            <div className="bg-slate-100 p-3" />
            {days.map((dayIndex) => (
              <div
                key={dayIndex}
                className="bg-slate-100 p-3 text-center font-medium text-slate-700 text-sm"
              >
                <div>{ALL_DAYS[dayIndex].substring(0, 3)}</div>
              </div>
            ))}

            {/* Time Rows */}
            {hours.map((hourIndex) => (
              <div key={hourIndex} className="contents">
                <div className="bg-slate-50 p-3 text-sm font-medium text-slate-600 flex items-center">
                  {formatHour(hourIndex)}
                </div>
                {days.map((dayIndex) => {
                  const count = getAvailabilityCount(dayIndex, hourIndex);
                  const hasFatigue = hasFatigueRisk(dayIndex, hourIndex);
                  const rank = getRankForCell(dayIndex, hourIndex);
                  const key = `${dayIndex}-${hourIndex}`;
                  const isHovered = hoveredCell === key;
                  const userAvailable = availabilities[0]?.[dayIndex]?.[hourIndex];
                  const confirmed = isConfirmed(dayIndex, hourIndex);

                  return (
                    <div
                      key={key}
                      className={`bg-white p-3 min-h-[60px] relative cursor-pointer transition-all group ${
                        isHovered ? 'ring-2 ring-blue-500 ring-inset z-10' : ''
                      } ${userAvailable ? 'ring-1 ring-blue-300 ring-inset' : ''} ${
                        confirmed ? 'ring-2 ring-green-500 ring-inset z-10' : ''
                      }`}
                      onMouseEnter={() => {
                        setHoveredCell(key);
                        if (dragMode !== null) handleDragOver(dayIndex, hourIndex);
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const newMode = userAvailable ? 'remove' : 'add';
                        setDragMode(newMode);
                        toggleAvailability(dayIndex, hourIndex);
                      }}
                    >
                      {/* Availability Gradient */}
                      {count > 0 && (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 ${getOpacityClass(count)}`}
                        />
                      )}

                      {confirmed && (
                        <div className="absolute inset-0 bg-green-500 opacity-30" />
                      )}

                      <div className="relative z-10 flex flex-col items-center justify-center h-full">
                        {confirmed && (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-green-600 text-white shadow-lg mb-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}

                        {rank && !confirmed && (
                          <div className={`
                            w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg mb-1
                            ${rank === 1 ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' : ''}
                            ${rank === 2 ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white' : ''}
                            ${rank === 3 ? 'bg-gradient-to-br from-slate-600 to-slate-700 text-white' : ''}
                          `}>
                            {rank}
                          </div>
                        )}

                        {count > 0 && !rank && !confirmed && (
                          <div className={`text-xs font-semibold drop-shadow-md ${count >= 3 ? 'text-white' : 'text-slate-700'}`}>
                            {count}/{participants.length}
                          </div>
                        )}

                        {hasFatigue && (
                          <div className="absolute top-1 right-1">
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                              <AlertTriangle className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {isHovered && (
                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-20 shadow-xl pointer-events-none">
                          <div className="font-semibold">{ALL_DAYS[dayIndex]} {formatHour(hourIndex)}</div>
                          <div className="text-slate-300 mt-0.5">
                            {count} of {participants.length} available
                          </div>
                          {count > 0 && (
                            <div className="text-slate-400 mt-0.5">
                              {getAvailableParticipants(dayIndex, hourIndex).map(p => p.name).join(', ')}
                            </div>
                          )}
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
        <div className="flex items-center gap-6 text-sm flex-wrap">
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
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-blue-300" />
            <span className="text-slate-600">Your availability</span>
          </div>
        </div>
      </div>
    </div>
  );
}
