import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { computedWith } from 'ngx-signal-operators';
import { EMPTY, tap } from 'rxjs';
import { GeminiService } from '../services/gemini.service';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'ng-gemini-assistant';
  geminiService = inject(GeminiService);
  $result = signal<any>('');
  $contents = signal<string>('');
  $resource = rxResource<string, string | undefined>(
    {
      request: computedWith(this.$contents)
        .skip(1)
        .filter(txt => txt.trim().length > 0)
        .default(undefined),
      // in the angular v20, the loader is replaced by stream
      loader: (params) => {
        if (params.request === null) return EMPTY;
        console.log(`Loading contents: ${params.request}`);
        return this.geminiService.searchContent$(params.request)
      }
    }
  )

  protected generate(contents: string): void {
    this.$contents.set(contents);
  }


  protected generateContent(contents: string): void {
    this.geminiService.generateContent$(contents).pipe(
      tap(result => this.$result.set(result)),
    ).subscribe();
  }

  protected searchContent(contents: string): void {
    this.geminiService.searchContent$(contents).pipe(
      tap(result => this.$result.set(result)),
    ).subscribe();
  }

  protected chat(contents: string): void {
    this.geminiService.generateChat(contents).pipe(
      tap(result => this.$result.set(result)),
    ).subscribe();
  }
}
