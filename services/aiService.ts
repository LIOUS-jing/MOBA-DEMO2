import { GoogleGenAI } from "@google/genai";
import { GameState } from '../types';

/**
 * Calls the Gemini API to get a MOBA-assistant-themed response.
 * Uses the API key from process.env.API_KEY.
 * @param query User prompt
 * @param gameState Current simulated game context
 */
export const getAIResponse = async (query: string, gameState: GameState): Promise<string> => {
  // Always create a new instance right before the call to ensure the latest key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';

  // Optimized system instruction for a pro-level MOBA assistant.
  const systemInstruction = `You are "Hextech Assistant" (海克斯助手), a pro-level MOBA coach for League of Legends or Honor of Kings.
Current Game State: ${gameState}.

Tone & Style:
- Professional, concise, and strategic.
- Language: Simplified Chinese (简体中文).
- Length: STRICTLY under 40 characters.
- Use game-specific terminology (e.g., "gank", "farm", "kiting", "obj").
- If the player is DEAD, focus on a quick "post-mortem" tip.
- If the player is SHOPPING, recommend an item based on the state.
- For normal queries, give a specific tactical directive.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: query || "分析当前局势并给出一条核心指令。",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        topP: 0.9,
        // No maxOutputTokens to avoid truncation unless specifically needed.
      },
    });

    // Access the text property directly as per the latest SDK spec.
    return response.text || "数据中心暂时失去同步，请保持专注。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Graceful fallback for demo continuity
    return "海克斯核心负载中，建议先稳住发育。";
  }
};