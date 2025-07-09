/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import { ContentListUnion, GoogleGenAI } from '@google/genai';
import { environment } from '../environments/environment';
import { currentWeatherToolConfig, WeatherParams } from '../models';


@Injectable({ providedIn: 'root' })
export class GeminiService {
  #contentAi = new GoogleGenAI({ apiKey: environment.geminiAPIKey });

  readonly #toolMap: { [key: string]: (params: any) => Promise<any> } = {
    currentWeatherTool: this.currentWeatherTool.bind(this)
  };

  async generateContent(contents: ContentListUnion) {
    const response = await this.#contentAi.models.generateContent({
      model: environment.geminiModel,
      contents,
      config: {
        tools: [{
          functionDeclarations: [currentWeatherToolConfig]
        }]
      }
    });

    if (!response.functionCalls || response.functionCalls.length === 0) {
      console.log('Response:', response.text);
      return response.text;
    }

    const results: Record<string, any> = {};
    for (const call of response.functionCalls) {
      if (call?.name && this.#toolMap[call.name]) {
        const fn = this.#toolMap[call.name];
        if (fn) {
          const result = await fn(call.args);
          results[call.name] = result;
        }
      }
    }
    console.log('Function result:', results);
    return results;
  }

  async currentWeatherTool(params: WeatherParams) {
    const { location, unit } = params;
    return {
      location,
      temperature: "25°" + (unit.toLowerCase() === "celsius" ? "C" : "F"),
    };
  }

}



