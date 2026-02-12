import { WeeklyCalendar } from './components/WeeklyCalendar';
import { RecommendationPanel } from './components/RecommendationPanel';
import { TradeoffBreakdown } from './components/TradeoffBreakdown';
import { PreferenceControls } from './components/PreferenceControls';
import { Header } from './components/Header';

function App() {
  const topRecommendations = [
    {
      day: 'Tuesday',
      time: '3:00 PM',
      dayIndex: 1,
      timeIndex: 7,
    },
    {
      day: 'Thursday',
      time: '2:00 PM',
      dayIndex: 3,
      timeIndex: 6,
    },
    {
      day: 'Wednesday',
      time: '10:00 AM',
      dayIndex: 2,
      timeIndex: 2,
    },
  ];

  const participants = [
    { name: 'You', color: '#3B82F6' },
    { name: 'Alex', color: '#8B5CF6' },
    { name: 'Jordan', color: '#EC4899' },
    { name: 'Sam', color: '#10B981' },
    { name: 'Casey', color: '#F59E0B' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header participants={participants} />
      
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          {/* Left Column - Calendar and Controls */}
          <div className="space-y-6">
            <WeeklyCalendar 
              topRecommendations={topRecommendations}
              participants={participants}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TradeoffBreakdown />
              <PreferenceControls />
            </div>
          </div>

          {/* Right Column - Recommendation Panel */}
          <div>
            <RecommendationPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
