import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { from, tap } from 'rxjs';
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

  protected generateContent(contents: string = 'Why the sky is blue? answer in 3 sentences'): void {
    from(this.geminiService.generateContent$(contents)).pipe(
      tap(result => this.$result.set(result)),
    ).subscribe(
      (result) => console.log('Result from Gemini Service:', result));
  }

}
