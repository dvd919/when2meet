import type { AvailabilityGrid } from './types';

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let gapiLoaded = false;
let gisLoaded = false;

// Load the Google API client library
function loadGapiScript(): Promise<void> {
  if (gapiLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
      // Script already in DOM, just init
      gapi.load('client', async () => {
        await gapi.client.init({});
        await gapi.client.load(DISCOVERY_DOC);
        gapiLoaded = true;
        resolve();
      });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client', async () => {
        await gapi.client.init({});
        await gapi.client.load(DISCOVERY_DOC);
        gapiLoaded = true;
        resolve();
      });
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadGisScript(): Promise<void> {
  if (gisLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      gisLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function getTokenClient(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response.access_token);
      },
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export interface CalendarEvent {
  summary: string;
  start: Date;
  end: Date;
}

async function fetchEvents(weekStart: Date): Promise<CalendarEvent[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const response = await gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: weekStart.toISOString(),
    timeMax: weekEnd.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  const events: CalendarEvent[] = [];
  for (const item of response.result.items || []) {
    // Skip all-day events
    if (!item.start?.dateTime || !item.end?.dateTime) continue;
    events.push({
      summary: item.summary || '(No title)',
      start: new Date(item.start.dateTime),
      end: new Date(item.end.dateTime),
    });
  }
  return events;
}

// Convert events to availability: slots WITHOUT events = available
export function eventsToAvailability(
  events: CalendarEvent[],
  weekStart: Date,
  meetingDays: number[],
  startHour: number,
  endHour: number,
): AvailabilityGrid {
  const grid: AvailabilityGrid = Array.from({ length: 7 }, () => Array(14).fill(false));

  // Mark all meeting-configured slots as available first
  for (const day of meetingDays) {
    for (let h = startHour; h <= endHour; h++) {
      grid[day][h] = true;
    }
  }

  // Then mark slots that overlap with events as unavailable
  for (const event of events) {
    const eventStart = event.start;
    const eventEnd = event.end;

    for (const day of meetingDays) {
      // Get the actual date for this day of the week
      const dayDate = new Date(weekStart);
      // weekStart is Monday (day 0), so add day index
      dayDate.setDate(dayDate.getDate() + day);

      for (let h = startHour; h <= endHour; h++) {
        const slotStart = new Date(dayDate);
        slotStart.setHours(h + 8, 0, 0, 0); // h=0 is 8AM
        const slotEnd = new Date(dayDate);
        slotEnd.setHours(h + 9, 0, 0, 0);

        // Check overlap
        if (eventStart < slotEnd && eventEnd > slotStart) {
          grid[day][h] = false;
        }
      }
    }
  }

  return grid;
}

// Get the Monday of the current week
export function getCurrentWeekMonday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getNextWeekMonday(): Date {
  const monday = getCurrentWeekMonday();
  monday.setDate(monday.getDate() + 7);
  return monday;
}

export function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} – ${sunday.toLocaleDateString('en-US', opts)}`;
}

// Main entry point
export async function importGoogleCalendar(
  weekStart: Date,
  meetingDays: number[],
  startHour: number,
  endHour: number,
): Promise<AvailabilityGrid> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google Client ID not configured');
  }

  await Promise.all([loadGapiScript(), loadGisScript()]);
  await getTokenClient(clientId);

  const events = await fetchEvents(weekStart);
  return eventsToAvailability(events, weekStart, meetingDays, startHour, endHour);
}
