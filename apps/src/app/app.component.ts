import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, ResourceRef, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { signalMethod } from '@ngrx/signals';
import { computedWith } from 'ngx-signal-operators';
import { EMPTY } from 'rxjs';
import { GeminiService } from '../services/gemini.service';
import { ConversationMessageComponent } from './components/conversation-message.component';

type GeminiType = 'chat' | 'generate' | 'search';
type ContentsType = { type: GeminiType; content: string };
type ConversationItem = {
  request: string;
  response: string;
  type: GeminiType;
  timestamp: Date;
};
type ProcessConversationUpdate = {
  resource: ResourceRef<string | undefined>;
  request: ContentsType | null;
};

@Component({
  imports: [RouterModule, ConversationMessageComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  protected $currentRequest = signal<ContentsType | null>(null);
  protected $conversations = signal<ConversationItem[]>([]);
  #geminiService = inject(GeminiService);
  #$lastProcessedResponse = signal<string>('');
  // Filter out empty or null content requests
  #$validRequest = computedWith(this.$currentRequest)
    .skip(1)
    .filter((request: ContentsType | null) => request !== null && request.content.trim().length > 0)
    .default(null);
  // Resource to handle content generation requests
  protected $aiResource = rxResource<string, ContentsType | null>({
    params: () => this.#$validRequest(),
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

  #processConversation = signalMethod(({ resource, request }: ProcessConversationUpdate) => {
    const currentResponse = (resource.value() ?? "").trim();
    if (resource.status() !== 'resolved' || !request || !resource.value() || !currentResponse || currentResponse === this.#$lastProcessedResponse()) {
      return;
    }
    this.#saveConversation({
      request: request.content,
      response: currentResponse,
      type: request.type,
      timestamp: new Date()
    });
    this.#$lastProcessedResponse.set(currentResponse);
  });

  /**
   * Save conversation to history - add new or update existing for streaming
   */
  #saveConversation(newItem: ConversationItem): void {
    const conversations = this.$conversations();
    const lastConversation = conversations[conversations.length - 1];
    // Check if this is truly a new conversation (not an update of existing)
    if (!lastConversation || lastConversation.request !== newItem.request) {
      this.$conversations.update(prev => [...prev, newItem]);
    } else {
      // Update existing conversation response (for streaming)
      this.$conversations.update(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = newItem;
        return updated;
      });
    }
  }

  constructor() {
    effect(() => {
      this.#processConversation({ resource: this.$aiResource, request: this.#$validRequest() });
    });
  }

  protected sendRequest(type: GeminiType, content: string): void {
    // Reset last processed response for new request
    this.#$lastProcessedResponse.set('');
    this.$currentRequest.set({ type, content });

    // Clear search input field
    const inputEl = this.searchInput();
    if (inputEl) {
      inputEl.nativeElement.value = '';
    }
  }

}