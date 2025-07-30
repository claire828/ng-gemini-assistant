/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import { Content, ContentListUnion, GenerateContentResponse, GoogleGenAI } from '@google/genai';
import { forkJoin, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { ToolMap, ToolParams, ToolResult, WeatherParams, WeatherResult } from '../models';
import { buildContentWithFunctionResponses, buildFunctionResponses, generateContentPayload, hasFunctionCalls } from '../utils/gemini.util';


@Injectable({ providedIn: 'root' })
export class GeminiService {
  readonly #contentAi = new GoogleGenAI({ apiKey: environment.geminiAPIKey });
  readonly #toolMap: ToolMap = {
    currentWeatherTool: this.#currentWeatherTool.bind(this)
  };


  generateContent$(contents: ContentListUnion): Observable<string> {
    const config = generateContentPayload(contents);
    return from(this.#contentAi.models.generateContent(config)).pipe(
      switchMap(response => {
        if (!hasFunctionCalls(response)) {
          return of(response.text ?? '');
        }
        return this.#handleFunctionCalls$(response, contents);
      })
    );
  }

  #handleFunctionCalls$(
    response: GenerateContentResponse,
    originalContents: ContentListUnion
  ): Observable<string> {
    const funcCalls = response.functionCalls ?? [];
    const functionCall$ = funcCalls.reduce<Observable<ToolResult>[]>((acc, call) => {
      const toolFn = call?.name && this.#toolMap[call.name as keyof ToolMap];
      if (toolFn && call.args) {
        acc.push(toolFn(call.args as unknown as ToolParams));
      }
      return acc;
    }, []);
    return forkJoin(functionCall$).pipe(
      switchMap(results => {
        const functionResponses = buildFunctionResponses(funcCalls, results);
        const newContents = buildContentWithFunctionResponses(originalContents, response, functionResponses);
        return this.#generateFinalResponse$(newContents);
      })
    );
  }


  #generateFinalResponse$(newContents: Content[]): Observable<string> {
    const followUpConfig = generateContentPayload(newContents);
    return from(this.#contentAi.models.generateContent(followUpConfig)).pipe(
      map(finalResponse => finalResponse.text ?? ''),
      tap(finalResponse => console.log('Final AI response:', finalResponse))
    );
  }

  #currentWeatherTool(params: WeatherParams): Observable<WeatherResult> {
    const { location, unit } = params;
    return of({
      location,
      temperature: "25°" + (unit.toLowerCase() === "celsius" ? "C" : "F"),
    });
  }

}





// #generateInternalToolApi(functionCallObservables: Observable<any>[]) {
//   return forkJoin(functionCallObservables).pipe(
//     map(results => {
//       const resultMap: Record<string, ToolMap[keyof ToolMap] extends ToolFunction<any, infer R> ? R : never> = {};
//       results.forEach((result, index) => {
//         if (result) {
//           resultMap[index] = result;
//         }
//       });
//       console.log('Function result:', resultMap);
//       return resultMap;
//     })
//   );
// }