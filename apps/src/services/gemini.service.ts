/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import { ContentListUnion, GenerateContentResponse, GoogleGenAI } from '@google/genai';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../environments/environment';
import { currentWeatherTool, ToolMap } from '../models';
import { buildContentWithFunctionResponses, executeToolFunctionCalls$, generateChatContentPayload, generateContentPayload, generateUrlContentPayload, hasFunctionCalls } from '../utils';


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
    return new Observable<string>(subscriber => {
      this.#chatAi.sendMessageStream({ message })
        .then(async stream => {
          let fullResponse = '';
          for await (const chunk of stream) {
            const chunkText = chunk.text ?? '';
            fullResponse += chunkText;
            subscriber.next(fullResponse);
          }
          subscriber.complete();
        })
        .catch(error => subscriber.error(error));
    });
  }


  #handleFunctionCalls$(
    originalContents: ContentListUnion,
    contentResponse: GenerateContentResponse,
  ): Observable<string> {
    return executeToolFunctionCalls$(this.#toolMap, contentResponse).pipe(
      switchMap(functionResponses => {
        const newContents = buildContentWithFunctionResponses(originalContents, contentResponse, functionResponses);
        return this.generateContent$(newContents);
      })
    );
  }

}