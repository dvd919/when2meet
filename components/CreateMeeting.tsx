import { useState } from 'react';
import { Sparkles, Calendar, Clock, ChevronRight, LogIn } from 'lucide-react';
import { useScheduling } from '../src/SchedulingContext';

const DAY_ABBREVS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatHourLabel(index: number): string {
  const hour = index + 8;
  if (hour === 12) return '12 PM';
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

export function CreateMeeting() {
  const { createMeeting, joinMeeting, loading } = useScheduling();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(11);

  // Join existing meeting
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');

  const toggleDay = (index: number) => {
    setSelectedDays(prev =>
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index].sort()
    );
  };

  const canCreate = name.trim().length > 0 && selectedDays.length > 0 && endHour > startHour && !loading;

  const handleCreate = async () => {
    if (!canCreate) return;
    await createMeeting({
      name: name.trim(),
      description: description.trim(),
      days: selectedDays,
      startHour,
      endHour,
    });
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !joinName.trim() || loading) return;
    setJoinError('');
    const ok = await joinMeeting(joinCode.trim(), joinName.trim());
    if (!ok) setJoinError('Meeting not found. Check the code.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">AI When2Meet</h1>
            <p className="text-sm text-slate-500">Smart group scheduling</p>
          </div>
        </div>

        {!showJoin ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5">
              <h2 className="text-xl font-semibold text-white">Create a New Meeting</h2>
              <p className="text-blue-100 text-sm mt-1">Set up your meeting and invite participants</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Meeting Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Weekly Team Sync"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What's this meeting about?"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Available Days
                </label>
                <div className="flex gap-2">
                  {DAY_ABBREVS.map((day, i) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(i)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        selectedDays.includes(i)
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Range
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={startHour}
                    onChange={e => setStartHour(Number(e.target.value))}
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 bg-white"
                  >
                    {Array.from({ length: 14 }, (_, i) => (
                      <option key={i} value={i}>{formatHourLabel(i)}</option>
                    ))}
                  </select>
                  <span className="text-slate-500 font-medium">to</span>
                  <select
                    value={endHour}
                    onChange={e => setEndHour(Number(e.target.value))}
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 bg-white"
                  >
                    {Array.from({ length: 14 }, (_, i) => (
                      <option key={i} value={i}>{formatHourLabel(i)}</option>
                    ))}
                  </select>
                </div>
                {endHour <= startHour && (
                  <p className="text-red-500 text-xs mt-2">End time must be after start time</p>
                )}
              </div>

              <button
                onClick={handleCreate}
                disabled={!canCreate}
                className={`w-full py-3.5 font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                  canCreate
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-purple-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Create Meeting
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button onClick={() => setShowJoin(true)} className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                  Have an invite code? Join an existing meeting
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Join existing meeting */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5">
              <h2 className="text-xl font-semibold text-white">Join a Meeting</h2>
              <p className="text-blue-100 text-sm mt-1">Enter the invite code to join</p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Invite Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. K7X4NP"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-mono text-lg tracking-widest text-center uppercase"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Your Name</label>
                <input
                  type="text"
                  value={joinName}
                  onChange={e => setJoinName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {joinError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {joinError}
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={!joinCode.trim() || !joinName.trim() || loading}
                className={`w-full py-3.5 font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                  joinCode.trim() && joinName.trim() && !loading
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Join Meeting
                  </>
                )}
              </button>

              <div className="text-center">
                <button onClick={() => setShowJoin(false)} className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                  Or create a new meeting
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
