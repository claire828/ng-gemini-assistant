import { Content, ContentListUnion, FunctionCall, GenerateContentResponse } from "@google/genai";
import { ToolMap, ToolResult } from "../models";

interface FunctionResponse {
  name: keyof ToolMap;
  response: ToolResult;
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
export function convertToContent(item: unknown): Content {
  if (typeof item === 'string') {
    return { role: 'user', parts: [{ text: item }] };
  } else if (!!item && typeof item === 'object' && 'role' in item && 'parts' in item) {
    return item as Content;
  } else {
    return { role: 'user', parts: [item as any] };
  }
}

/**
 * Create function responses
 */
export function buildContentWithFunctionResponses(
  originalContents: ContentListUnion,
  modelResponse: GenerateContentResponse,
  functionResponses: FunctionResponse[],
  promptText: string = "Please generate a response based on the results of the above function calls."
): Content[] {
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
 * Check whether the response includes any function calls.
 */
export function hasFunctionCalls(response: GenerateContentResponse): boolean {
  return !!(response && response.functionCalls && response.functionCalls.length > 0);
}

