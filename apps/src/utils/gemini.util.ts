import { Content, ContentListUnion, FunctionCall, GenerateContentResponse } from "@google/genai";
import { environment } from "../environments/environment";
import { currentWeatherToolConfig, ToolMap, ToolResult } from "../models";

interface FunctionResponse {
  name: keyof ToolMap;
  response: ToolResult;
}

export function generateContentPayload(contents: ContentListUnion) {
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


/**
 * Build function responses from function calls and results.
 * @param functionCalls List of function calls.
 * @param results Corresponding tool results.
 * @returns Array of FunctionResponse.
 */
export function buildFunctionResponses(
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
  return [
    ...(Array.isArray(originalContents) ? originalContents : [originalContents]),
    // {
    //   role: 'model',
    //   parts: modelResponse.functionCalls?.map((call: any) => ({
    //     functionCall: {
    //       name: call.name,
    //       args: call.args
    //     }
    //   })) ?? []
    // },
    {
      role: 'user',
      parts: [
        ...functionResponses.map(resp => ({
          functionResponse: {
            name: resp.name,
            response: resp.response
          }
        })),
        { text: promptText }
      ]
    }
  ].filter(
    (item): item is Content =>
      typeof item === 'object' &&
      'role' in item &&
      Array.isArray(item.parts) &&
      item.parts.length > 0
  );
}

/**
 * 檢查回應是否包含 function calls
 */
export function hasFunctionCalls(response: GenerateContentResponse): boolean {
  return !!(response && response.functionCalls && response.functionCalls.length > 0);
}

