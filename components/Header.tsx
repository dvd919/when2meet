import { Sparkles, Users } from 'lucide-react';

interface Participant {
  name: string;
  color: string;
}

interface HeaderProps {
  participants: Participant[];
}

export function Header({ participants }: HeaderProps) {
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
                <h1 className="font-semibold text-slate-900">AI When2Meet</h1>
                <p className="text-sm text-slate-500">Smart group scheduling</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{participants.length} participants</span>
            </div>
            <div className="flex items-center gap-2">
              {participants.map((p) => (
                <div 
                  key={p.name} 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                >
                  {p.name.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
