import { Sparkles, Users, UserPlus, Settings } from 'lucide-react';
import { useScheduling } from '../src/SchedulingContext';

export function Header() {
  const { participants, meetingConfig, setPhase } = useScheduling();

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-[1600px] mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">
                  {meetingConfig?.name ?? 'AI When2Meet'}
                </h1>
                <p className="text-sm text-slate-500">
                  {meetingConfig?.description || 'Smart group scheduling'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Invite Code Badge */}
            {meetingConfig && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-xs text-blue-600">Code:</span>
                <span className="font-mono font-semibold text-blue-700 tracking-wider">
                  {meetingConfig.inviteCode}
                </span>
              </div>
            )}

            {/* Add People Button */}
            <button
              onClick={() => setPhase('invite')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              title="Manage participants"
            >
              <UserPlus className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">Invite</span>
            </button>

            {/* Participant Count */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{participants.length}</span>
            </div>

            {/* Participant Avatars */}
            <div className="flex items-center -space-x-1">
              {participants.slice(0, 6).map((p) => (
                <div
                  key={p.name}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm border-2 border-white"
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                >
                  {p.name.charAt(0)}
                </div>
              ))}
              {participants.length > 6 && (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 text-xs font-semibold bg-slate-200 border-2 border-white">
                  +{participants.length - 6}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
