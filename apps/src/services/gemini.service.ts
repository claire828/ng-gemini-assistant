/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import { ContentListUnion, GoogleGenAI } from '@google/genai';
import { forkJoin, from, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../environments/environment';
import { ToolFunction, WeatherParams, WeatherResult } from '../models';
import { generateContentResponse } from '../utils/gemini.util';

/**
 * Tool map type definition with specific tool signatures
 */
interface ToolMap {
  currentWeatherTool: ToolFunction<WeatherParams, WeatherResult>;
  // Add more tools here with their specific types
  // newTool: ToolFunction<NewToolParams, NewToolResult>;
}

/**
 * Union type for all possible tool parameters
 */
type ToolParams = WeatherParams; // Add more as needed: | NewToolParams | AnotherToolParams;

@Injectable({ providedIn: 'root' })
export class GeminiService {
  readonly #contentAi = new GoogleGenAI({ apiKey: environment.geminiAPIKey });
  readonly #toolMap: ToolMap = {
    currentWeatherTool: this.#currentWeatherTool.bind(this)
  };


  generateContent$(contents: ContentListUnion) {
    const config = generateContentResponse(contents);

    return from(this.#contentAi.models.generateContent(config)).pipe(
      switchMap(response => {
        if (!response.functionCalls || response.functionCalls.length === 0) {
          console.log('Response:', response.text);
          return of(response.text);
        }

        // Process function calls
        const functionCallObservables = response.functionCalls.map(call => {
          if (
            call?.name &&
            (call.name in this.#toolMap) &&
            call.args
          ) {
            const fn = this.#toolMap[call.name as keyof ToolMap];
            return fn(call.args as unknown as ToolParams);
          }
          return of(null);
        });

        return forkJoin(functionCallObservables).pipe(
          map(results => {
            const resultMap: Record<string, any> = {};
            response.functionCalls?.forEach((call, index) => {
              if (call?.name && results[index]) {
                resultMap[call.name] = results[index];
              }
            });
            console.log('Function result:', resultMap);
            return resultMap;
          })
        );
      })
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



