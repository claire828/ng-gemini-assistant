import { ContentListUnion } from "@google/genai";
import { environment } from "../environments/environment";
import { currentWeatherToolConfig } from "../models";

export function generateContentResponse(contents: ContentListUnion) {
  return {
    model: environment.geminiModel,
    contents,
    config: {
      tools: [{
        functionDeclarations: [currentWeatherToolConfig]
      }]
    }
  };
}