import { useState } from 'react';
import { Copy, Check, ChevronRight, Sparkles, Users, ArrowLeft, X } from 'lucide-react';
import { useScheduling } from '../src/SchedulingContext';

export function InvitePage() {
  const { meetingConfig, participants, removeParticipant, setPhase } = useScheduling();
  const [copied, setCopied] = useState(false);

  if (!meetingConfig) return null;

  const inviteLink = `${window.location.origin}${window.location.pathname}?code=${meetingConfig.inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = inviteLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5">
            <h2 className="text-xl font-semibold text-white">{meetingConfig.name}</h2>
            {meetingConfig.description && (
              <p className="text-blue-100 text-sm mt-1">{meetingConfig.description}</p>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Invite Link */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Share this link with participants
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600 font-mono truncate">
                  {inviteLink}
                </div>
                <button
                  onClick={handleCopy}
                  className={`px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-slate-500">Invite code:</span>
                <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-mono font-semibold tracking-widest text-lg">
                  {meetingConfig.inviteCode}
                </span>
              </div>
            </div>

            {/* Participants (live from Firestore) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {participants.length} joined
                </span>
                {participants.length < 2 && (
                  <span className="text-xs text-slate-400">— waiting for others to join...</span>
                )}
              </div>
              <div className="space-y-2">
                {participants.map(p => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {p.name}
                        {p.isCreator && (
                          <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            Organizer
                          </span>
                        )}
                      </span>
                    </div>
                    {!p.isCreator && (
                      <button
                        onClick={() => removeParticipant(p.name)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setPhase('setup')}
                className="px-5 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setPhase('scheduling')}
                className="flex-1 py-3 font-medium rounded-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-purple-700"
              >
                Start Scheduling
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Others can join anytime — you'll see their availability appear in real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
