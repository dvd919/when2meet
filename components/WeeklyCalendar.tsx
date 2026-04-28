import { AlertTriangle, Check, Calendar as CalendarIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import { useScheduling } from '../src/SchedulingContext';
import { getCurrentWeekMonday, getNextWeekMonday, formatWeekLabel } from '../src/googleCalendar';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function WeeklyCalendar() {
  const {
    participants,
    recommendations,
    toggleAvailability,
    setDragMode,
    handleDragOver,
    getAvailabilityCount,
    getAvailableParticipants,
    availabilities,
    currentUserAvailability,
    confirmedSlot,
    meetingConfig,
    importFromGoogle,
    loading,
  } = useScheduling();

  const days = meetingConfig ? meetingConfig.days : [0, 1, 2, 3, 4, 5, 6];
  const startHour = meetingConfig?.startHour ?? 0;
  const endHour = meetingConfig?.endHour ?? 13;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importWeek, setImportWeek] = useState<'this' | 'next'>('this');
  const [importError, setImportError] = useState('');

  // Synchronous drag direction so onMouseEnter never reads a stale dragMode
  // between onMouseDown's setState and React's next commit.
  const dragModeRef = useRef<'add' | 'remove' | null>(null);
  const endDrag = () => {
    dragModeRef.current = null;
    setDragMode(null);
  };

  const hasGoogleClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleImport = async () => {
    setImportError('');
    try {
      const weekStart = importWeek === 'this' ? getCurrentWeekMonday() : getNextWeekMonday();
      await importFromGoogle(weekStart);
      setShowImport(false);
    } catch (err: any) {
      setImportError(err.message || 'Failed to import calendar');
    }
  };

  const getRankForCell = (dayIndex: number, hourIndex: number): number | null => {
    const top3 = recommendations.slice(0, 3);
    const idx = top3.findIndex(r => r.dayIndex === dayIndex && r.timeIndex === hourIndex);
    return idx !== -1 ? idx + 1 : null;
  };

  const hasFatigueRisk = (dayIndex: number, hourIndex: number): boolean => {
    let fatiguedCount = 0;
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
      if (consecutive >= 8) fatiguedCount++;
    }
    // Only flag if at least 2 participants are fatigued, or if it's a solo meeting and 1 is
    return fatiguedCount >= Math.max(2, Math.ceil(participants.length * 0.4));
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
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
    >
      <div className="border-b border-slate-200 px-4 py-3 bg-slate-50 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Weekly Availability</h2>
        {hasGoogleClientId && (
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
          >
            <CalendarIcon className="w-4 h-4" />
            Import Google Calendar
          </button>
        )}
      </div>

      {/* Google Calendar Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImport(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Import from Google Calendar</h3>
              <p className="text-sm text-slate-600 mt-1">
                Your busy times will be marked as unavailable
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Which week?</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setImportWeek('this')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      importWeek === 'this'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    This week
                  </button>
                  <button
                    onClick={() => setImportWeek('next')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      importWeek === 'next'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Next week
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {importWeek === 'this'
                    ? formatWeekLabel(getCurrentWeekMonday())
                    : formatWeekLabel(getNextWeekMonday())}
                </p>
              </div>

              {importError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {importError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowImport(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGoogleImport}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CalendarIcon className="w-4 h-4" />
                      Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  const userAvailable = currentUserAvailability[dayIndex]?.[hourIndex];
                  const confirmed = isConfirmed(dayIndex, hourIndex);

                  const availablePeople = getAvailableParticipants(dayIndex, hourIndex);

                  return (
                    <div
                      key={key}
                      className={`p-1 min-h-[40px] relative cursor-pointer transition-all group ${
                        isHovered ? 'ring-2 ring-blue-500 ring-inset z-10' : ''
                      } ${confirmed ? 'ring-2 ring-green-500 ring-inset z-10' : ''
                      } ${userAvailable ? 'bg-blue-50' : 'bg-white'}`}
                      onMouseEnter={() => {
                        setHoveredCell(key);
                        const mode = dragModeRef.current;
                        if (mode !== null) handleDragOver(dayIndex, hourIndex, mode);
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const newMode = userAvailable ? 'remove' : 'add';
                        dragModeRef.current = newMode;
                        setDragMode(newMode);
                        toggleAvailability(dayIndex, hourIndex);
                      }}
                    >
                      {/* Background: colored by how many are available */}
                      {count > 0 && (
                        <div
                          className={`absolute inset-0 ${getOpacityClass(count)}`}
                          style={{
                            background: userAvailable
                              ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                              : 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
                          }}
                        />
                      )}

                      {confirmed && (
                        <div className="absolute inset-0 bg-green-500 opacity-30" />
                      )}

                      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-1">
                        {/* Confirmed check */}
                        {confirmed && (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-green-600 text-white shadow-lg">
                            <Check className="w-4 h-4" />
                          </div>
                        )}

                        {/* Rank Badge */}
                        {rank && !confirmed && (
                          <div className={`
                            w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg
                            ${rank === 1 ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' : ''}
                            ${rank === 2 ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white' : ''}
                            ${rank === 3 ? 'bg-gradient-to-br from-slate-600 to-slate-700 text-white' : ''}
                          `}>
                            {rank}
                          </div>
                        )}

                        {/* Participant dots */}
                        {count > 0 && !rank && !confirmed && (
                          <div className="flex items-center gap-0.5 flex-wrap justify-center">
                            {availablePeople.map(p => (
                              <div
                                key={p.name}
                                className="w-4 h-4 rounded-full border border-white/80 shadow-sm flex-shrink-0"
                                style={{ backgroundColor: p.color }}
                                title={p.name}
                              />
                            ))}
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
                      {isHovered && (
                        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-20 shadow-xl pointer-events-none">
                          <div className="font-semibold">{ALL_DAYS[dayIndex]} {formatHour(hourIndex)}</div>
                          <div className="text-slate-300 mt-1">
                            {count} of {participants.length} available
                          </div>
                          {count > 0 && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {availablePeople.map(p => (
                                <div key={p.name} className="flex items-center gap-1">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: p.color }}
                                  />
                                  <span className="text-slate-300">{p.name}</span>
                                </div>
                              ))}
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
      <div className="border-t border-slate-200 px-4 py-2 bg-slate-50">
        <div className="flex items-center gap-4 text-xs flex-wrap text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-50 rounded border border-blue-200" />
            <span>You</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded" />
            <span>You + others</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gradient-to-br from-slate-400 to-slate-500 rounded" />
            <span>Others only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <span>AI pick</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-2 h-2 text-white" />
            </div>
            <span>Fatigue risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
