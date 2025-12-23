
import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const processVoiceLog = async (text: string, location?: string): Promise<Partial<LogEntry>> => {
  const model = 'gemini-3-flash-preview';
  const now = new Date();
  const currentTimeContext = now.toLocaleString();
  
  const prompt = `
    Context:
    - Current Time/Date: ${currentTimeContext}
    - User Location: ${location || 'Unknown'}
    - User Input: "${text}"
    
    Task:
    1. Role: Professional Audit Log Assistant.
    2. Summary: Create a 3-4 word title for a Google Calendar event.
    3. Calendar Event: 
       - Calculate 'start' and 'end' as ISO-8601 strings. 
       - If user doesn't specify time, 'end' is NOW (${now.toISOString()}) and 'start' is exactly 1 hour ago.
    4. Sheet Row:
       - date: YYYY-MM-DD
       - activity: Detailed description.
       - category: One of [Work, Meeting, Health, Personal, Admin, Transit].
       - duration: e.g. "1h", "45m".
       - location: Cleaned name of the building/place.
    
    Return ONLY valid JSON. No markdown blocks. No extra text.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            calendarEvent: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                start: { type: Type.STRING },
                end: { type: Type.STRING }
              },
              required: ["title", "start", "end"]
            },
            sheetRow: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                activity: { type: Type.STRING },
                category: { type: Type.STRING },
                duration: { type: Type.STRING },
                location: { type: Type.STRING }
              },
              required: ["date", "activity", "category", "duration", "location"]
            }
          },
          required: ["summary", "calendarEvent", "sheetRow"]
        }
      }
    });

    const textOutput = response.text || "";
    // Clean potential markdown wrap
    const jsonStr = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};
