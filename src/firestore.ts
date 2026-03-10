import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  deleteDoc,
  getDocs,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { MeetingConfig, AvailabilityGrid } from './types';

// --- Availability encoding ---
// Store as a flat map: { "0-0": true, "2-5": true, ... } for sparse storage
function gridToMap(grid: AvailabilityGrid): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (let d = 0; d < grid.length; d++) {
    for (let h = 0; h < grid[d].length; h++) {
      if (grid[d][h]) {
        map[`${d}-${h}`] = true;
      }
    }
  }
  return map;
}

function mapToGrid(map: Record<string, boolean>): AvailabilityGrid {
  const grid: AvailabilityGrid = Array.from({ length: 7 }, () => Array(14).fill(false));
  for (const key of Object.keys(map)) {
    const [d, h] = key.split('-').map(Number);
    if (d >= 0 && d < 7 && h >= 0 && h < 14) {
      grid[d][h] = true;
    }
  }
  return grid;
}

// --- Meeting CRUD ---

export interface MeetingDoc {
  name: string;
  description: string;
  days: number[];
  startHour: number;
  endHour: number;
  inviteCode: string;
  createdAt: number;
  confirmedSlot: { dayIndex: number; hourIndex: number } | null;
}

export interface ParticipantDoc {
  name: string;
  color: string;
  isCreator: boolean;
  availability: Record<string, boolean>;
  joinedAt: number;
}

export async function createMeeting(config: MeetingConfig): Promise<void> {
  const meetingRef = doc(db, 'meetings', config.inviteCode);
  const meetingDoc: MeetingDoc = {
    name: config.name,
    description: config.description,
    days: config.days,
    startHour: config.startHour,
    endHour: config.endHour,
    inviteCode: config.inviteCode,
    createdAt: Date.now(),
    confirmedSlot: null,
  };
  await setDoc(meetingRef, meetingDoc);
}

export async function getMeeting(inviteCode: string): Promise<MeetingDoc | null> {
  const meetingRef = doc(db, 'meetings', inviteCode);
  const snap = await getDoc(meetingRef);
  return snap.exists() ? (snap.data() as MeetingDoc) : null;
}

export async function setConfirmedSlot(
  inviteCode: string,
  slot: { dayIndex: number; hourIndex: number } | null
): Promise<void> {
  const meetingRef = doc(db, 'meetings', inviteCode);
  await updateDoc(meetingRef, { confirmedSlot: slot });
}

// --- Participants ---

export async function getParticipantCount(inviteCode: string): Promise<number> {
  const colRef = collection(db, 'meetings', inviteCode, 'participants');
  const snap = await getDocs(colRef);
  return snap.size;
}

export async function addParticipant(
  inviteCode: string,
  name: string,
  color: string,
  isCreator: boolean
): Promise<void> {
  const partRef = doc(db, 'meetings', inviteCode, 'participants', name);
  const partDoc: ParticipantDoc = {
    name,
    color,
    isCreator,
    availability: {},
    joinedAt: Date.now(),
  };
  await setDoc(partRef, partDoc);
}

export async function removeParticipant(inviteCode: string, name: string): Promise<void> {
  const partRef = doc(db, 'meetings', inviteCode, 'participants', name);
  await deleteDoc(partRef);
}

export async function updateAvailability(
  inviteCode: string,
  participantName: string,
  grid: AvailabilityGrid
): Promise<void> {
  const partRef = doc(db, 'meetings', inviteCode, 'participants', participantName);
  await updateDoc(partRef, { availability: gridToMap(grid) });
}

// --- Real-time listeners ---

export function onMeetingChange(
  inviteCode: string,
  callback: (meeting: MeetingDoc | null) => void
): Unsubscribe {
  const meetingRef = doc(db, 'meetings', inviteCode);
  return onSnapshot(meetingRef, (snap) => {
    callback(snap.exists() ? (snap.data() as MeetingDoc) : null);
  });
}

export interface ParticipantWithAvailability {
  name: string;
  color: string;
  isCreator: boolean;
  availability: AvailabilityGrid;
}

export function onParticipantsChange(
  inviteCode: string,
  callback: (participants: ParticipantWithAvailability[]) => void
): Unsubscribe {
  const colRef = collection(db, 'meetings', inviteCode, 'participants');
  return onSnapshot(colRef, (snap) => {
    const participants: ParticipantWithAvailability[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as ParticipantDoc;
      participants.push({
        name: data.name,
        color: data.color,
        isCreator: data.isCreator,
        availability: mapToGrid(data.availability),
      });
    });
    // Sort: creator first, then by join time
    participants.sort((a, b) => {
      if (a.isCreator && !b.isCreator) return -1;
      if (!a.isCreator && b.isCreator) return 1;
      return 0;
    });
    callback(participants);
  });
}
