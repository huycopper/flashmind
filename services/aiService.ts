import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; 
// NOTE: in a real app, do not expose API_KEY in frontend unless strict restrictions are applied or using a proxy.
// For this demo, we assume the environment variable is injected by the bundler/runtime.

let ai: GoogleGenAI | null = null;

try {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI", error);
}

export const aiService = {
  generateAnswer: async (frontText: string, deckContext: string = ''): Promise<string> => {
    if (!ai) {
      throw new Error("AI Service not configured (Missing API Key)");
    }

    const prompt = `
      You are an expert study assistant creating flashcards.
      Context: ${deckContext}
      Term/Question: "${frontText}"
      
      Task: Provide a concise, accurate, and clear Answer/Definition for the back of this flashcard. 
      Keep it under 30 words if possible. Do not add conversational filler.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text?.trim() || "No answer generated.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to fetch AI suggestion.");
    }
  }
};