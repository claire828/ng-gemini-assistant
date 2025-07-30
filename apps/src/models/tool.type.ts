
import { Observable } from "rxjs";
import { WeatherParams, WeatherResult } from "./weather-tool.config";

/**
 * Tool function signature for Gemini function calling
 */
export type ToolFunction<T = Record<string, unknown>, R = unknown> = (params: T) => Observable<R>;

/**
 * Union type for all possible tool parameters
 */
export type ToolParams = WeatherParams; // Add more as needed: | NewToolParams | AnotherToolParams;
export type ToolResult = WeatherResult; // Add more as needed: | NewToolResult | AnotherToolResult;


/**
 * Tool map type definition with specific tool signatures
 */
export interface ToolMap {
  currentWeatherTool: ToolFunction<WeatherParams, WeatherResult>;
  // Add more tools here with their specific types
  // newTool: ToolFunction<NewToolParams, NewToolResult>;
}
