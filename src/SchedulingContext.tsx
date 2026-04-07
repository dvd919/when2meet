import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { Participant, Preferences, AvailabilityGrid, Recommendation, SlotMetrics, MeetingConfig, AppPhase } from './types';
import * as fs from './firestore';
import { importGoogleCalendar } from './googleCalendar';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = 14;

const PARTICIPANT_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B',
  '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

function createEmptyGrid(): AvailabilityGrid {
  return Array.from({ length: 7 }, () => Array(HOURS).fill(false));
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function formatHour(hourIndex: number): string {
  const hour = hourIndex + 8;
  if (hour === 12) return '12:00 PM';
  if (hour > 12) return `${hour - 12}:00 PM`;
  return `${hour}:00 AM`;
}

interface SchedulingContextType {
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;
  meetingConfig: MeetingConfig | null;
  createMeeting: (config: Omit<MeetingConfig, 'inviteCode'>) => Promise<void>;
  joinMeeting: (inviteCode: string, userName: string) => Promise<boolean>;
  currentUserName: string;
  participants: Participant[];
  addParticipant: (name: string) => Promise<void>;
  removeParticipant: (name: string) => Promise<void>;
  availabilities: AvailabilityGrid[];
  toggleAvailability: (dayIndex: number, hourIndex: number) => void;
  setDragMode: (mode: 'add' | 'remove' | null) => void;
  dragMode: 'add' | 'remove' | null;
  handleDragOver: (dayIndex: number, hourIndex: number, modeOverride?: 'add' | 'remove') => void;
  preferences: Preferences;
  recommendations: Recommendation[];
  selectedRecommendation: number;
  setPreferences: (prefs: Preferences) => void;
  setSelectedRecommendation: (index: number) => void;
  getAvailabilityCount: (dayIndex: number, hourIndex: number) => number;
  getAvailableParticipants: (dayIndex: number, hourIndex: number) => Participant[];
  computeWhatIf: (dayIndex: number, hourIndex: number, addParticipantIndex: number) => number;
  confirmedSlot: { dayIndex: number; hourIndex: number } | null;
  setConfirmedSlot: (slot: { dayIndex: number; hourIndex: number } | null) => void;
  loading: boolean;
  importFromGoogle: (weekStart: Date) => Promise<void>;
}

const SchedulingContext = createContext<SchedulingContextType | null>(null);

export function SchedulingProvider({ children }: { children: ReactNode }) {
  // Check URL for invite code
  const urlCode = new URLSearchParams(window.location.search).get('code');

  const [phase, setPhaseRaw] = useState<AppPhase>(urlCode ? 'join' as AppPhase : 'setup');
  const [meetingConfig, setMeetingConfig] = useState<MeetingConfig | null>(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [loading, setLoading] = useState(false);

  // Participants and availability from Firestore real-time listener
  const [firestoreParticipants, setFirestoreParticipants] = useState<fs.ParticipantWithAvailability[]>([]);

  const [preferences, setPreferences] = useState<Preferences>({
    importance: 'medium',
    flexibility: 'medium',
    idealTime: 'afternoon',
  });
  const [selectedRecommendation, setSelectedRecommendation] = useState(0);
  const [dragMode, setDragMode] = useState<'add' | 'remove' | null>(null);
  const [confirmedSlot, setConfirmedSlotLocal] = useState<{ dayIndex: number; hourIndex: number } | null>(null);

  // Local user availability for optimistic updates
  const [localAvailability, setLocalAvailability] = useState<AvailabilityGrid>(() => createEmptyGrid());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPhase = useCallback((p: AppPhase) => {
    setPhaseRaw(p);
    // Update URL
    if (meetingConfig && p === 'scheduling') {
      window.history.replaceState(null, '', `?code=${meetingConfig.inviteCode}`);
    }
  }, [meetingConfig]);

  // Subscribe to Firestore when we have a meeting
  useEffect(() => {
    if (!meetingConfig) return;
    const code = meetingConfig.inviteCode;

    const unsubMeeting = fs.onMeetingChange(code, (meeting) => {
      if (meeting) {
        setConfirmedSlotLocal(meeting.confirmedSlot);
      }
    });

    const unsubParts = fs.onParticipantsChange(code, (parts) => {
      setFirestoreParticipants(parts);
      // Sync local availability from server for current user
      const me = parts.find(p => p.name === currentUserName);
      if (me) {
        setLocalAvailability(me.availability);
      }
    });

    return () => {
      unsubMeeting();
      unsubParts();
    };
  }, [meetingConfig?.inviteCode, currentUserName]);

  // Flush local availability to Firestore (debounced)
  const flushAvailability = useCallback((grid: AvailabilityGrid) => {
    if (!meetingConfig || !currentUserName) return;
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => {
      fs.updateAvailability(meetingConfig.inviteCode, currentUserName, grid);
    }, 300);
  }, [meetingConfig, currentUserName]);

  // --- Actions ---

  const createMeeting = useCallback(async (config: Omit<MeetingConfig, 'inviteCode'>) => {
    setLoading(true);
    const inviteCode = generateInviteCode();
    const fullConfig: MeetingConfig = { ...config, inviteCode };

    await fs.createMeeting(fullConfig);

    const userName = 'You';
    await fs.addParticipant(inviteCode, userName, PARTICIPANT_COLORS[0], true);

    setMeetingConfig(fullConfig);
    setCurrentUserName(userName);
    setLocalAvailability(createEmptyGrid());
    setLoading(false);
    setPhase('invite');
  }, [setPhase]);

  const joinMeeting = useCallback(async (inviteCode: string, userName: string): Promise<boolean> => {
    setLoading(true);
    const meeting = await fs.getMeeting(inviteCode.toUpperCase());
    if (!meeting) {
      setLoading(false);
      return false;
    }

    const config: MeetingConfig = {
      name: meeting.name,
      description: meeting.description,
      days: meeting.days,
      startHour: meeting.startHour,
      endHour: meeting.endHour,
      inviteCode: meeting.inviteCode,
    };

    // Pick a color based on how many participants already in Firestore
    const existing = await fs.getParticipantCount(inviteCode.toUpperCase());
    const color = PARTICIPANT_COLORS[existing % PARTICIPANT_COLORS.length];

    await fs.addParticipant(inviteCode.toUpperCase(), userName, color, false);

    setMeetingConfig(config);
    setCurrentUserName(userName);
    setLocalAvailability(createEmptyGrid());
    setConfirmedSlotLocal(meeting.confirmedSlot);
    setLoading(false);
    setPhase('scheduling');
    return true;
  }, [setPhase]);

  const addParticipant = useCallback(async (name: string) => {
    if (!meetingConfig) return;
    if (firestoreParticipants.some(p => p.name.toLowerCase() === name.toLowerCase())) return;
    const existing = await fs.getParticipantCount(meetingConfig.inviteCode);
    const color = PARTICIPANT_COLORS[existing % PARTICIPANT_COLORS.length];
    await fs.addParticipant(meetingConfig.inviteCode, name, color, false);
  }, [meetingConfig, firestoreParticipants]);

  const removeParticipant = useCallback(async (name: string) => {
    if (!meetingConfig) return;
    const p = firestoreParticipants.find(p => p.name === name);
    if (!p || p.isCreator) return;
    await fs.removeParticipant(meetingConfig.inviteCode, name);
  }, [meetingConfig, firestoreParticipants]);

  const toggleAvailability = useCallback((dayIndex: number, hourIndex: number) => {
    setLocalAvailability(prev => {
      const next = prev.map(row => [...row]);
      next[dayIndex][hourIndex] = !next[dayIndex][hourIndex];
      flushAvailability(next);
      return next;
    });
  }, [flushAvailability]);

  const handleDragOver = useCallback((dayIndex: number, hourIndex: number, modeOverride?: 'add' | 'remove') => {
    const mode = modeOverride ?? dragMode;
    if (mode === null) return;
    setLocalAvailability(prev => {
      const next = prev.map(row => [...row]);
      next[dayIndex][hourIndex] = mode === 'add';
      flushAvailability(next);
      return next;
    });
  }, [dragMode, flushAvailability]);

  const importFromGoogle = useCallback(async (weekStart: Date) => {
    if (!meetingConfig) return;
    setLoading(true);
    try {
      const grid = await importGoogleCalendar(
        weekStart,
        meetingConfig.days,
        meetingConfig.startHour,
        meetingConfig.endHour,
      );
      setLocalAvailability(grid);
      flushAvailability(grid);
    } finally {
      setLoading(false);
    }
  }, [meetingConfig, flushAvailability]);

  const setConfirmedSlot = useCallback((slot: { dayIndex: number; hourIndex: number } | null) => {
    setConfirmedSlotLocal(slot);
    if (meetingConfig) {
      fs.setConfirmedSlot(meetingConfig.inviteCode, slot);
    }
  }, [meetingConfig]);

  // Build participants list from Firestore data
  const participants: Participant[] = useMemo(() => {
    return firestoreParticipants.map(p => ({
      name: p.name,
      color: p.color,
      isCreator: p.isCreator,
    }));
  }, [firestoreParticipants]);

  // Build availabilities: current user uses local (optimistic), others from Firestore
  const availabilities: AvailabilityGrid[] = useMemo(() => {
    return firestoreParticipants.map(p => {
      if (p.name === currentUserName) return localAvailability;
      return p.availability;
    });
  }, [firestoreParticipants, currentUserName, localAvailability]);

  // --- Computed ---

  const getAvailabilityCount = useCallback((dayIndex: number, hourIndex: number): number => {
    return availabilities.reduce((count, grid) => count + (grid[dayIndex]?.[hourIndex] ? 1 : 0), 0);
  }, [availabilities]);

  const getAvailableParticipants = useCallback((dayIndex: number, hourIndex: number): Participant[] => {
    return participants.filter((_, i) => availabilities[i]?.[dayIndex]?.[hourIndex]);
  }, [availabilities, participants]);

  const getParticipantFatigue = useCallback((participantIndex: number, dayIndex: number, hourIndex: number): number => {
    const grid = availabilities[participantIndex];
    if (!grid) return 0;
    let consecutive = 0;
    for (let h = hourIndex - 1; h >= 0; h--) {
      if (grid[dayIndex]?.[h]) consecutive++;
      else break;
    }
    for (let h = hourIndex + 1; h < HOURS; h++) {
      if (grid[dayIndex]?.[h]) consecutive++;
      else break;
    }
    return consecutive;
  }, [availabilities]);

  const computeSlotMetrics = useCallback((dayIndex: number, hourIndex: number): SlotMetrics => {
    const total = participants.length;
    if (total === 0) return { groupSatisfaction: 0, fatigueScore: 0, fairnessScore: 0, cancellationRisk: 100 };

    const availCount = getAvailabilityCount(dayIndex, hourIndex);
    const groupSatisfaction = Math.round((availCount / total) * 100);

    let totalFatigue = 0;
    let availableCount = 0;
    for (let i = 0; i < total; i++) {
      if (availabilities[i]?.[dayIndex]?.[hourIndex]) {
        totalFatigue += getParticipantFatigue(i, dayIndex, hourIndex);
        availableCount++;
      }
    }
    const avgFatigue = availableCount > 0 ? totalFatigue / availableCount : 0;
    const fatigueScore = Math.round(Math.min(100, (avgFatigue / 8) * 100));

    const sacrifices: number[] = participants.map((_, i) =>
      availabilities[i]?.[dayIndex]?.[hourIndex] ? 0 : 100
    );
    const avgSacrifice = sacrifices.reduce((a, b) => a + b, 0) / total;
    const variance = sacrifices.reduce((sum, s) => sum + (s - avgSacrifice) ** 2, 0) / total;
    const stdDev = Math.sqrt(variance);
    const fairnessScore = Math.round(Math.max(0, 100 - stdDev * 2.5));

    const cancellationRisk = Math.round(
      Math.min(100, Math.max(0, (1 - availCount / total) * 60 + fatigueScore * 0.4))
    );

    return { groupSatisfaction, fatigueScore, fairnessScore, cancellationRisk };
  }, [participants, availabilities, getAvailabilityCount, getParticipantFatigue]);

  const computeWhatIf = useCallback((dayIndex: number, hourIndex: number, addParticipantIndex: number): number => {
    const total = participants.length;
    if (total === 0) return 0;

    // Pretend this participant is available
    const hypotheticalAvailabilities = availabilities.map((grid, i) => {
      if (i !== addParticipantIndex) return grid;
      const next = grid.map(row => [...row]);
      next[dayIndex][hourIndex] = true;
      return next;
    });

    const availCount = hypotheticalAvailabilities.reduce((count, grid) => count + (grid[dayIndex]?.[hourIndex] ? 1 : 0), 0);
    const groupSatisfaction = Math.round((availCount / total) * 100);

    let totalFatigue = 0;
    let availableCount = 0;
    for (let i = 0; i < total; i++) {
      if (!hypotheticalAvailabilities[i]?.[dayIndex]?.[hourIndex]) continue;
      let consecutive = 0;
      for (let h = hourIndex - 1; h >= 0; h--) {
        if (hypotheticalAvailabilities[i][dayIndex]?.[h]) consecutive++; else break;
      }
      for (let h = hourIndex + 1; h < HOURS; h++) {
        if (hypotheticalAvailabilities[i][dayIndex]?.[h]) consecutive++; else break;
      }
      totalFatigue += consecutive;
      availableCount++;
    }
    const avgFatigue = availableCount > 0 ? totalFatigue / availableCount : 0;
    const fatigueScore = Math.round(Math.min(100, (avgFatigue / 8) * 100));

    const sacrifices: number[] = hypotheticalAvailabilities.map(grid => grid[dayIndex]?.[hourIndex] ? 0 : 100);
    const avgSacrifice = sacrifices.reduce((a, b) => a + b, 0) / total;
    const variance = sacrifices.reduce((sum, s) => sum + (s - avgSacrifice) ** 2, 0) / total;
    const fairnessScore = Math.round(Math.max(0, 100 - Math.sqrt(variance) * 2.5));

    const cancellationRisk = Math.round(Math.min(100, Math.max(0, (1 - availCount / total) * 60 + fatigueScore * 0.4)));

    const hour = hourIndex + 8;
    const timeBonus = (() => {
      switch (preferences.idealTime) {
        case 'morning': return hour >= 8 && hour <= 11 ? 10 : 0;
        case 'afternoon': return hour >= 12 && hour <= 16 ? 10 : 0;
        case 'evening': return hour >= 17 && hour <= 21 ? 10 : 0;
      }
    })();
    const importanceWeight = preferences.importance === 'high' ? 1.5 : preferences.importance === 'low' ? 0.7 : 1.0;
    const flexibilityPenalty = preferences.flexibility === 'high' ? 0.5 : preferences.flexibility === 'low' ? 1.5 : 1.0;

    return Math.min(100, Math.round(
      groupSatisfaction * 0.4 * importanceWeight +
      (100 - fatigueScore) * 0.2 +
      fairnessScore * 0.25 * flexibilityPenalty +
      (100 - cancellationRisk) * 0.15 +
      timeBonus
    ));
  }, [participants, availabilities, preferences]);

  const recommendations = useMemo((): Recommendation[] => {
    if (!meetingConfig || participants.length < 2) return [];
    const scored: Recommendation[] = [];

    const timePreferenceBonus = (hourIndex: number): number => {
      const hour = hourIndex + 8;
      switch (preferences.idealTime) {
        case 'morning': return hour >= 8 && hour <= 11 ? 10 : 0;
        case 'afternoon': return hour >= 12 && hour <= 16 ? 10 : 0;
        case 'evening': return hour >= 17 && hour <= 21 ? 10 : 0;
      }
    };

    const importanceWeight = preferences.importance === 'high' ? 1.5 : preferences.importance === 'low' ? 0.7 : 1.0;
    const flexibilityPenalty = preferences.flexibility === 'high' ? 0.5 : preferences.flexibility === 'low' ? 1.5 : 1.0;

    for (const day of meetingConfig.days) {
      for (let hour = meetingConfig.startHour; hour <= meetingConfig.endHour; hour++) {
        const count = getAvailabilityCount(day, hour);
        if (count < 2) continue;

        const metrics = computeSlotMetrics(day, hour);
        const score =
          metrics.groupSatisfaction * 0.4 * importanceWeight +
          (100 - metrics.fatigueScore) * 0.2 +
          metrics.fairnessScore * 0.25 * flexibilityPenalty +
          (100 - metrics.cancellationRisk) * 0.15 +
          timePreferenceBonus(hour);

        scored.push({
          day: DAYS[day],
          time: formatHour(hour),
          dayIndex: day,
          timeIndex: hour,
          score: Math.min(100, Math.round(score)),
          metrics,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 10);
  }, [availabilities, preferences, meetingConfig, participants.length, getAvailabilityCount, computeSlotMetrics]);

  const value: SchedulingContextType = {
    phase,
    setPhase,
    meetingConfig,
    createMeeting,
    joinMeeting,
    currentUserName,
    participants,
    addParticipant,
    removeParticipant,
    availabilities,
    preferences,
    recommendations,
    selectedRecommendation,
    toggleAvailability,
    setDragMode,
    dragMode,
    handleDragOver,
    setPreferences,
    setSelectedRecommendation,
    getAvailabilityCount,
    getAvailableParticipants,
    computeWhatIf,
    confirmedSlot,
    setConfirmedSlot,
    loading,
    importFromGoogle,
  };

  return (
    <SchedulingContext.Provider value={value}>
      {children}
    </SchedulingContext.Provider>
  );
}

export function useScheduling() {
  const ctx = useContext(SchedulingContext);
  if (!ctx) throw new Error('useScheduling must be used within SchedulingProvider');
  return ctx;
}
