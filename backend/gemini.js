// backend/gemini.js

// not working dude to rate limit and api call cooldown

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("api key"); // or replace with your key in quotes

const generationConfig = {
  temperature: 0.3,
  topK: 1,
  topP: 1,
  maxOutputTokens: 256,
};

export async function extractDateAndVenue(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
Extract the event date and venue from the following text. If either is not found, return "Unknown".

Return only a valid JSON object like:
{ "date": "...", "venue": "..." }

Text:
${text}
`;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig,
    });

    const raw = await result.response.text();

    const match = raw.match(/{[\s\S]*}/);
    if (match) {
      return JSON.parse(match[0]);
    }

    return { date: "Unknown", venue: "Unknown" };
  } catch (error) {
    console.error("Gemini API error:", error.message);
    return { date: "Unknown", venue: "Unknown" };
  }
}
