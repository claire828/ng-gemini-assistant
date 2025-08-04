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
      tools: [{ functionDeclarations: [currentWeatherToolConfig] }]
    }
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
  const contents: Content[] = [];

  if (Array.isArray(originalContents)) {
    originalContents.forEach(item => {
      if (typeof item === 'string') {
        contents.push({ role: 'user', parts: [{ text: item }] });
      } else if (typeof item === 'object' && 'role' in item && 'parts' in item) {
        contents.push(item as Content);
      } else {
        // PartUnion (Part object)
        contents.push({ role: 'user', parts: [item as any] });
      }
    });
  } else {
    if (typeof originalContents === 'string') {
      contents.push({ role: 'user', parts: [{ text: originalContents }] });
    } else if (typeof originalContents === 'object' && 'role' in originalContents && 'parts' in originalContents) {
      contents.push(originalContents as Content);
    } else {
      // PartUnion (Part object)
      contents.push({ role: 'user', parts: [originalContents as any] });
    }
  }

  console.log('Converted contents:', JSON.stringify(contents, null, 2));

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

  console.log('Final contents:', JSON.stringify(contents, null, 2));
  return contents;
}

/**
 * 檢查回應是否包含 function calls
 */
export function hasFunctionCalls(response: GenerateContentResponse): boolean {
  return !!(response && response.functionCalls && response.functionCalls.length > 0);
}

