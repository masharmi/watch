
export interface LogEntry {
  id: string;
  timestamp: number;
  originalText: string;
  summary: string;
  location?: string;
  calendarEvent: {
    title: string;
    start: string;
    end: string;
  };
  sheetRow: {
    date: string;
    activity: string;
    category: string;
    duration: string;
    location: string;
  };
}

export enum AppState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  CONFIRMING = 'CONFIRMING',
  SYNCING = 'SYNCING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
