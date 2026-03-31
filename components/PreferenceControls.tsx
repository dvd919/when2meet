import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useScheduling } from '../src/SchedulingContext';

export function PreferenceControls() {
  const { preferences, setPreferences } = useScheduling();
  const [local, setLocal] = useState(preferences);
  const [dirty, setDirty] = useState(false);

  const updateLocal = (updates: Partial<typeof local>) => {
    setLocal(prev => ({ ...prev, ...updates }));
    setDirty(true);
  };

  const apply = () => {
    setPreferences(local);
    setDirty(false);
  };

  return (
    <div>
      <div className="p-4 space-y-4">
        {/* Meeting Importance */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            Meeting Importance
          </label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => updateLocal({ importance: level })}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  local.importance === level
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
                onClick={() => updateLocal({ flexibility: level })}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  local.flexibility === level
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
                onClick={() => updateLocal({ idealTime: time })}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  local.idealTime === time
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
        <button
          onClick={apply}
          disabled={!dirty}
          className={`w-full py-3 font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-md ${
            dirty
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          {dirty ? 'Recalculate with Preferences' : 'Preferences Applied'}
        </button>
      </div>
    </div>
  );
}
