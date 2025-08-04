import { Content, ContentListUnion, FunctionCall, GenerateContentResponse } from "@google/genai";
import { environment } from "../environments/environment";
import { currentWeatherToolConfig, ToolMap, ToolResult } from "../models";

interface FunctionResponse {
  name: keyof ToolMap;
  response: ToolResult;
}

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

export function generateGeneralContentPayload(contents: ContentListUnion) {
  return {
    model: environment.geminiModel,
    contents,
    config: {} // No tools - for general questions
  };
}

export function generateFollowUpContentPayload(contents: ContentListUnion) {
  const payload = {
    model: environment.geminiModel,
    contents,
    config: {} // No tools needed for follow-up response
  };
  console.log('Follow-up payload:', JSON.stringify(payload, null, 2));
  return payload;
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


/**
 *  Map function responses from function calls and results.
 * @param functionCalls List of function calls.
 * @param results Corresponding tool results.
 * @returns Array of FunctionResponse.
 */
export function mapFunctionResponses(
  functionCalls: FunctionCall[],
  results: ToolResult[]
): FunctionResponse[] {
  return functionCalls?.reduce<FunctionResponse[]>((acc, call, idx) => {
    const response = results[idx];
    if (call?.name && response) {
      acc.push({ name: call.name as keyof ToolMap, response });
    }
    return acc;
  }, []) ?? [];
}

/**
 * Convert a single content item to Content format
 */
export function convertToContent(item: any): Content {
  if (typeof item === 'string') {
    return { role: 'user', parts: [{ text: item }] };
  } else if (typeof item === 'object' && 'role' in item && 'parts' in item) {
    return item as Content;
  } else {
    return { role: 'user', parts: [item as any] };
  }
}

/**
 * 建立包含 function responses 的新對話內容
 */
export function buildContentWithFunctionResponses(
  originalContents: ContentListUnion,
  modelResponse: GenerateContentResponse,
  functionResponses: FunctionResponse[],
  promptText: string = "Please generate a response based on the results of the above function calls."
): Content[] {
  console.log('Original contents:', JSON.stringify(originalContents, null, 2));

  // Convert ContentListUnion to Content array
  const contentsArray = Array.isArray(originalContents) ? originalContents : [originalContents];
  const contents: Content[] = contentsArray.map(convertToContent);

  // Add the model's function call response
  contents.push({
    role: 'model',
    parts: modelResponse.functionCalls?.map((call: FunctionCall) => ({
      functionCall: {
        name: call.name,
        args: call.args
      }
    })) ?? []
  });

  // Add user's function response
  contents.push({
    role: 'user',
    parts: [
      ...functionResponses.map(resp => ({
        functionResponse: {
          name: resp.name,
          response: resp.response as unknown as Record<string, unknown>
        }
      })),
      { text: promptText }
    ]
  });
  return contents;
}

/**
 * 檢查回應是否包含 function calls
 */
export function hasFunctionCalls(response: GenerateContentResponse): boolean {
  return !!(response && response.functionCalls && response.functionCalls.length > 0);
}

