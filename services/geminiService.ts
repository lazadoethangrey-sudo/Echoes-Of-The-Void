
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * Utility to retry a function with exponential backoff.
 * Useful for handling transient 429 (Rate Limit) errors.
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2, // Reduced retries to avoid sticking on 429s
  initialDelay: number = 1000
): Promise<T> {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isRateLimit = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || error?.status === 429;
      
      if (isRateLimit) {
        // If it's a quota issue, we might want to fail faster to let fallbacks take over
        if (i < maxRetries - 1) {
          console.warn(`Gemini quota hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; 
          continue;
        }
      }
      throw error;
    }
  }
  return await fn();
}

export const getStageDialogueStream = async (
  stageName: string, 
  stageDesc: string, 
  loreNote: string,
  onChunk: (text: string) => void
): Promise<void> => {
  // Rich fallbacks to ensure the game feels alive even without AI
  const fallbacks = [
    "Kaelen: Our path is clear. Do not let the void cloud your vision.",
    "Lyra: The whispers are getting louder... but my spells are sharper.",
    "Jax: Just another day in a dying timeline. Keep moving.",
    "Kaelen: Status report. The link is holding, for now.",
    "Lyra: I can feel the data stream rippling. Something is close.",
    "Jax: Load the cannons. If it bleeds data, we can kill it."
  ];

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const responseStream = await retryWithBackoff(async () => {
      return await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: `Grim RPG Banter. 
        Kaelen: Stoic Commander. Lyra: Cynical Mage. Jax: Brash Tank.
        World Lore: ${stageDesc}. 
        Immediate Detail: ${loreNote}.
        Location: "${stageName}".
        Task: 3 distinct lines. Name: Text.`,
        config: {
          temperature: 0.8,
          maxOutputTokens: 150,
        }
      });
    });

    for await (const chunk of responseStream) {
      const part = chunk as GenerateContentResponse;
      if (part.text) {
        onChunk(part.text);
      }
    }
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    // Use high-quality localized fallback on failure
    const randomFallbacks = [...fallbacks].sort(() => 0.5 - Math.random()).slice(0, 3);
    onChunk("\n" + randomFallbacks.join("\n"));
  }
};

export const getCombatLogEntry = async (attacker: string, target: string, skill: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `1 short grim RPG sentence: ${attacker} used ${skill} on ${target}.`,
        config: {
          temperature: 0.7,
          maxOutputTokens: 30
        }
      });
    }, 1); // Only 1 retry for combat logs to keep it snappy
    return response.text || `${attacker} executes ${skill} against ${target}.`;
  } catch (error) {
    return `${attacker} executes ${skill} against ${target}.`;
  }
};
