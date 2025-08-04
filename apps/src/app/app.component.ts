import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { computedWith } from 'ngx-signal-operators';
import { EMPTY } from 'rxjs';
import { GeminiService } from '../services/gemini.service';

type GeminiType = 'chat' | 'generate' | 'search';
type ContentsType = { type: GeminiType; content: string };

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  #geminiService = inject(GeminiService);
  #$contents = signal<ContentsType | null>(null);

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

  protected executeGemini(type: GeminiType, content: string): void {
    this.#$contents.set({ type, content });
  }
}