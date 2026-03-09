import { WeeklyCalendar } from './components/WeeklyCalendar';
import { RecommendationPanel } from './components/RecommendationPanel';
import { TradeoffBreakdown } from './components/TradeoffBreakdown';
import { PreferenceControls } from './components/PreferenceControls';
import { Header } from './components/Header';
import { CreateMeeting } from './components/CreateMeeting';
import { InvitePage } from './components/InvitePage';
import { JoinMeeting } from './components/JoinMeeting';
import { SchedulingProvider, useScheduling } from './src/SchedulingContext';

function AppContent() {
  const { phase } = useScheduling();

  if (phase === 'setup') return <CreateMeeting />;
  if (phase === 'invite') return <InvitePage />;
  if (phase === 'join') return <JoinMeeting />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">
            <WeeklyCalendar />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TradeoffBreakdown />
              <PreferenceControls />
            </div>
          </div>

          <div>
            <RecommendationPanel />
          </div>
        </div>
      </main>
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
