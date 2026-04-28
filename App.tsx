import { useState } from 'react';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { RecommendationPanel } from './components/RecommendationPanel';
import { TradeoffBreakdown } from './components/TradeoffBreakdown';
import { PreferenceControls } from './components/PreferenceControls';
import { Header } from './components/Header';
import { CreateMeeting } from './components/CreateMeeting';
import { InvitePage } from './components/InvitePage';
import { JoinMeeting } from './components/JoinMeeting';
import { ChatbotWidget } from './components/ChatbotWidget';
import { SchedulingProvider, useScheduling } from './src/SchedulingContext';

function BottomPanel() {
  const [tab, setTab] = useState<'preferences' | 'tradeoff'>('preferences');
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex border-b border-slate-200">
        {(['preferences', 'tradeoff'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'preferences' ? 'Preferences' : 'Tradeoff Breakdown'}
          </button>
        ))}
      </div>
      {tab === 'preferences' ? <PreferenceControls /> : <TradeoffBreakdown />}
    </div>
  );
}

function AppContent() {
  const { phase } = useScheduling();

  if (phase === 'setup') return <CreateMeeting />;
  if (phase === 'invite') return <InvitePage />;
  if (phase === 'join') return <JoinMeeting />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
          <div className="space-y-4">
            <WeeklyCalendar />
            <BottomPanel />
          </div>
          <div>
            <RecommendationPanel />
          </div>
        </div>
      </main>
      <ChatbotWidget />
    </div>
  );
}

function App() {
  return (
    <SchedulingProvider>
      <AppContent />
    </SchedulingProvider>
  );
}

export default App;
