/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import { Content, ContentListUnion, GenerateContentResponse, GoogleGenAI } from '@google/genai';
import { forkJoin, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { currentWeatherTool, ToolMap, ToolParams, ToolResult } from '../models';
import { buildContentWithFunctionResponses, generateChatContentPayload, generateContentPayload, generateFollowUpContentPayload, generateUrlContentPayload, hasFunctionCalls, mapFunctionResponses } from '../utils/gemini.util';


@Injectable({ providedIn: 'root' })
export class GeminiService {
  readonly #contentAi = new GoogleGenAI({ apiKey: environment.geminiAPIKey });
  readonly #chatAi = this.#contentAi.chats.create(generateChatContentPayload());
  readonly #toolMap: ToolMap = {
    currentWeatherTool: currentWeatherTool.bind(this)
  };

  generateContent$(contents: ContentListUnion): Observable<string> {
    const contentPayload = generateContentPayload(contents);
    return from(this.#contentAi.models.generateContent(contentPayload)).pipe(
      switchMap(response => {
        if (!hasFunctionCalls(response)) {
          return of(response.text ?? '');
        }
        return this.#handleFunctionCalls$(contents, response);
      })
    );
  }

  generateSearch$(contents: ContentListUnion): Observable<string> {
    const contentPayload = generateUrlContentPayload(contents);
    return from(this.#contentAi.models.generateContent(contentPayload)).pipe(
      map(response => response.text ?? ''),
    );
  }

  generateChat$(message: string): Observable<string> {
    return from(this.#chatAi.sendMessage({
      message,
    })).pipe(map((response) => response.text ?? ''), tap((response) => console.log('Chat response:', response)));
  }

  #handleFunctionCalls$(
    originalContents: ContentListUnion,
    contentResponse: GenerateContentResponse,
  ): Observable<string> {
    // prepare internal tool API calls
    const funcCalls = contentResponse.functionCalls ?? [];
    const functionCall$ = funcCalls.reduce((acc, call) => {
      const toolFn = call?.name && this.#toolMap[call.name as keyof ToolMap];
      if (toolFn && call.args) {
        acc.push(toolFn(call.args as unknown as ToolParams));
      }
      return acc;
    }, [] as Observable<ToolResult>[]);
    // call the internal apis
    return forkJoin(functionCall$).pipe(
      switchMap(results => {
        // map the results and send to the LLM can process it
        const functionResponses = mapFunctionResponses(funcCalls, results);
        const newContents = buildContentWithFunctionResponses(originalContents, contentResponse, functionResponses);
        return this.#generateFinalResponse$(newContents);
      })
    );
  }


  #generateFinalResponse$(newContents: Content[]): Observable<string> {
    const followUpConfig = generateFollowUpContentPayload(newContents);
    return from(this.#contentAi.models.generateContent(followUpConfig)).pipe(
      map(finalResponse => finalResponse.text ?? ''),
    );
  }

}