import { useState } from 'react';
import { Sparkles, LogIn, AlertCircle } from 'lucide-react';
import { useScheduling } from '../src/SchedulingContext';

export function JoinMeeting() {
  const { joinMeeting, loading } = useScheduling();
  const urlCode = new URLSearchParams(window.location.search).get('code') ?? '';

  const [code, setCode] = useState(urlCode.toUpperCase());
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const canJoin = name.trim().length > 0 && code.trim().length > 0 && !loading;

  const handleJoin = async () => {
    if (!canJoin) return;
    setError('');
    const success = await joinMeeting(code.trim().toUpperCase(), name.trim());
    if (!success) {
      setError('Meeting not found. Check the invite code and try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
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

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5">
            <h2 className="text-xl font-semibold text-white">Join a Meeting</h2>
            <p className="text-blue-100 text-sm mt-1">Enter your name to mark your availability</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Invite Code */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Invite Code
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="e.g. K7X4NP"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-mono text-lg tracking-widest text-center uppercase"
              />
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Join Button */}
            <button
              onClick={handleJoin}
              disabled={!canJoin}
              className={`w-full py-3.5 font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                canJoin
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-purple-700'
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

            {/* Create link */}
            <div className="text-center">
              <button
                onClick={() => {
                  window.history.replaceState(null, '', window.location.pathname);
                  window.location.reload();
                }}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Or create a new meeting
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
