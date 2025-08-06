import { Content, ContentListUnion, FunctionCall, GenerateContentResponse } from "@google/genai";
import { forkJoin, map, Observable } from "rxjs";
import { ToolMap, ToolParams, ToolResult } from "../models";

interface FunctionResponse {
  name: keyof ToolMap;
  response: ToolResult;
}

/**
 * Execute tool function calls and return responses
 */
export function executeToolFunctionCalls$(
  toolMap: ToolMap,
  contentResponse: GenerateContentResponse
): Observable<FunctionResponse[]> {
  // Create array of observables with their corresponding function call info
  const toolCallsWithObservables = (contentResponse.functionCalls ?? []).reduce((acc, call) => {
    const name = call?.name as keyof ToolMap;
    const toolFn = call?.name && toolMap[name];
    if (toolFn && call.args && call.name) {
      acc.push({
        name,
        toolReq$: toolFn(call.args as unknown as ToolParams)
      });
    }
    return acc;
  }, [] as Array<{ name: keyof ToolMap; toolReq$: Observable<ToolResult> }>);

  // Execute all tool calls and directly map to FunctionResponse
  return forkJoin(toolCallsWithObservables.map(item => item.toolReq$)).pipe(
    map((results: ToolResult[]) => {
      return toolCallsWithObservables.map((item, idx) => ({
        name: item.name,
        response: results[idx]
      }));
    })
  );
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

