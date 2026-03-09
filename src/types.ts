export interface Participant {
  name: string;
  color: string;
  isCreator?: boolean;
}

export interface TimeSlot {
  dayIndex: number;
  hourIndex: number; // 0-13 mapping to 8AM-9PM
}

export interface Recommendation {
  day: string;
  time: string;
  dayIndex: number;
  timeIndex: number;
  score: number;
  metrics: SlotMetrics;
}

export interface SlotMetrics {
  groupSatisfaction: number;
  fatigueScore: number;
  fairnessScore: number;
  cancellationRisk: number;
}

export interface Preferences {
  importance: 'low' | 'medium' | 'high';
  flexibility: 'low' | 'medium' | 'high';
  idealTime: 'morning' | 'afternoon' | 'evening';
}

export interface MeetingConfig {
  name: string;
  description: string;
  days: number[]; // indices into DAYS array (0=Mon, 6=Sun)
  startHour: number; // 0-13 index (8AM-9PM)
  endHour: number; // 0-13 index
  inviteCode: string;
}

export type AppPhase = 'setup' | 'invite' | 'join' | 'scheduling';

// 7 days x 14 hours (8AM-9PM)
export type AvailabilityGrid = boolean[][];
