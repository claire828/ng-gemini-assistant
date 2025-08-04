
import { ContentListUnion } from "@google/genai";
import { environment } from "../environments/environment";
import { currentWeatherToolConfig } from "../models";


// NOTE: The Gemini API currently does not allow combining function calling (functionDeclarations) with urlContext or googleSearch in a single request.
export function generateContentPayload(contents: ContentListUnion) {
  return {
    model: environment.geminiModel,
    contents,
    config: {
      tools: [{ functionDeclarations: [currentWeatherToolConfig] }],
      systemInstruction: {
        parts: [{
          text: "You are a helpful AI assistant. You can answer general questions about any topic using your knowledge. Additionally, you have access to tools that you should use ONLY when specifically relevant to the user's question. For weather-related questions, use the weather tool. For all other questions, answer directly using your general knowledge."
        }]
      }
    }
  };
}

export function generateUrlContentPayload(contents: ContentListUnion) {
  return {
    model: environment.geminiModel,
    contents,
    config: {
      tools: [
        { urlContext: {} },
        { googleSearch: {} }
      ]
    }
  };
}

export function generateChatContentPayload() {
  return {
    model: environment.geminiModel,
    history: [
      {
        role: "user",
        parts: [{ text: "Hello" }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ],
  };
}
