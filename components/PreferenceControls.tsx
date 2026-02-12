import { Settings, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function PreferenceControls() {
  const [importance, setImportance] = useState<'low' | 'medium' | 'high'>('medium');
  const [flexibility, setFlexibility] = useState<'low' | 'medium' | 'high'>('medium');
  const [idealTime, setIdealTime] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900">Preferences</h3>
        </div>
        <p className="text-sm text-slate-600 mt-1">Adjust your scheduling preferences</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Meeting Importance */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            Meeting Importance
          </label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setImportance(level)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  importance === level
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Flexibility Level */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            Flexibility Level
          </label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFlexibility(level)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  flexibility === level
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Ideal Time of Day */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            Ideal Time of Day
          </label>
          <div className="flex gap-2">
            {(['morning', 'afternoon', 'evening'] as const).map((time) => (
              <button
                key={time}
                onClick={() => setIdealTime(time)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  idealTime === time
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {time.charAt(0).toUpperCase() + time.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Recalculate Button */}
        <button className="w-full py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md">
          <RefreshCw className="w-4 h-4" />
          Recalculate with Preferences
        </button>
      </div>
    </div>
  );
}
