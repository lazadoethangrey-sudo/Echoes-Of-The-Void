
import {GoogleGenAI, GenerateContentResponse} from "@google/genai";

export const getStageDialogueStream = async (
  stageName: string, 
  stageDesc: string, 
  loreNote: string,
  onChunk: (text: string) => void
): Promise<void> => {
  try {
    // Fix: Using correct initialization with named parameter and environment variable
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: `Grim RPG Banter. 
      Kaelen: Stoic Commander. Lyra: Cynical Mage. Jax: Brash Tank.
      World Lore: ${stageDesc}. 
      Immediate Detail: ${loreNote}.
      Location: "${stageName}".
      Task: 3 distinct, very brief lines about the lore and the threat.
      Characters must mention the specific "Immediate Detail" or reflect on the "World Lore".
      Format: Name: Text.`,
      config: {
        temperature: 0.85,
        maxOutputTokens: 120,
      }
    });

    for await (const chunk of responseStream) {
      // Fix: property access .text (not method) on the stream chunk
      const part = chunk as GenerateContentResponse;
      if (part.text) {
        onChunk(part.text);
      }
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    onChunk("Kaelen: This place... it's just like the records.\nLyra: Records can't capture this stench.\nJax: I don't care about history. Let's kill it.");
  }
};

export const getCombatLogEntry = async (attacker: string, target: string, skill: string): Promise<string> => {
  try {
    // Fix: Using correct initialization as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `1 short sentence: ${attacker} hits ${target} with ${skill}. Grim tone.`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 20
      }
    });
    // Fix: direct property access .text
    return response.text || `${attacker} strikes ${target}.`;
  } catch (error) {
    return `${attacker} attacks ${target}.`;
  }
};
