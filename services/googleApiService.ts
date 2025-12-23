
import { LogEntry } from "../types";

let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const hasAccessToken = () => !!accessToken;

export const createCalendarEvent = async (entry: LogEntry) => {
  if (!accessToken) throw new Error("No Google access token");

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: entry.calendarEvent.title,
      location: entry.location,
      description: `Original Voice Log: "${entry.originalText}"\nCategory: ${entry.sheetRow.category}`,
      start: { dateTime: entry.calendarEvent.start },
      end: { dateTime: entry.calendarEvent.end },
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Calendar API Error");
  }
  return await response.json();
};

export const appendToSheet = async (entry: LogEntry, spreadsheetId: string) => {
  if (!accessToken) throw new Error("No Google access token");

  const range = 'Sheet1!A1'; // Assumes Sheet1 exists
  const values = [[
    entry.sheetRow.date,
    new Date(entry.timestamp).toLocaleTimeString(),
    entry.sheetRow.category,
    entry.sheetRow.activity,
    entry.sheetRow.duration,
    entry.location
  ]];

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Sheets API Error");
  }
  return await response.json();
};
