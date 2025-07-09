import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { from } from 'rxjs';
import { GeminiService } from '../services/gemini.service';
import { NxWelcomeComponent } from './nx-welcome.component';

@Component({
  imports: [NxWelcomeComponent, RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'ng-gemini-assistant';
  geminiService = inject(GeminiService);
  constructor() {

    from(this.geminiService.generateContent('Why the sky is blue? answer in 3 sentences')).subscribe(
      (result) => console.log('Result from Gemini Service:', result));


  }
}
