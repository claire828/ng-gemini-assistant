import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { signalMethod } from '@ngrx/signals';
import { computedWith } from 'ngx-signal-operators';
import { EMPTY } from 'rxjs';
import { GeminiService } from '../services/gemini.service';

type GeminiType = 'chat' | 'generate' | 'search';
type ContentsType = { type: GeminiType; content: string };
type ConversationItem = {
  request: string;
  response: string;
  type: GeminiType;
  timestamp: Date;
};

@Component({
  imports: [RouterModule, DatePipe],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  #geminiService = inject(GeminiService);
  #$contents = signal<ContentsType | null>(null);
  #lastProcessedResponse = signal<string>('');

  $requestSignal = computedWith(this.#$contents)
    .skip(1)
    .filter((request: ContentsType | null) => request !== null && request.content.trim().length > 0)
    .default(null);

  $resource = rxResource<string, ContentsType | null>({
    params: () => this.$requestSignal(),
    stream: (params) => {
      if (params.params === null) return EMPTY;
      const { type, content } = params.params;
      switch (type) {
        case 'generate':
          return this.#geminiService.generateContent$(content);
        case 'search':
          return this.#geminiService.generateSearch$(content);
        case 'chat':
          return this.#geminiService.generateChat$(content);
        default:
          return EMPTY;
      }
    }
  });

  // Store conversation history
  $conversations = signal<ConversationItem[]>([]);

  // Signal method to process conversation updates
  #processConversation = signalMethod((update: { resource: any; request: ContentsType | null }) => {
    const { resource, request } = update;

    if (resource.status() === 'resolved' && request && resource.value()) {
      const currentResponse = resource.value()!;
      const lastResponse = this.#lastProcessedResponse();

      // Only add to history when we have a complete new response
      if (currentResponse !== lastResponse && currentResponse.trim()) {
        const newItem: ConversationItem = {
          request: request.content,
          response: currentResponse,
          type: request.type,
          timestamp: new Date()
        };

        // Check if this is truly a new conversation (not an update of existing)
        const conversations = this.$conversations();
        const lastConversation = conversations[conversations.length - 1];

        if (!lastConversation || lastConversation.request !== newItem.request) {
          // New conversation
          this.$conversations.update(prev => [...prev, newItem]);
        } else {
          // Update existing conversation response (for streaming)
          this.$conversations.update(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = newItem;
            return updated;
          });
        }

        this.#lastProcessedResponse.set(currentResponse);
      }
    }
  });

  constructor() {
    effect(() => {
      this.#processConversation({ resource: this.$resource, request: this.$requestSignal() });
    });
  }
  protected executeGemini(type: GeminiType, content: string): void {
    this.#$contents.set({ type, content });
  }

}