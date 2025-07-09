import { Observable } from "rxjs";

/**
 * Tool function signature for Gemini function calling
 */
export type ToolFunction<T = Record<string, unknown>, R = unknown> = (params: T) => Observable<R>;
