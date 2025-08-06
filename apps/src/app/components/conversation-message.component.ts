import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GeminiType } from 'apps/src/models';


@Component({
  selector: 'app-conversation-message',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4 border-b border-gray-200 pb-4 last:border-b-0">
      <!-- Status Header -->
      <div class="mb-2">
        @if (isLoading()) {
          <span class="inline-block rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
            PROCESSING... {{ type().toUpperCase() }}
          </span>
        } @else {
          <span class="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
            {{ type().toUpperCase() }}
          </span>
          @if (timestamp()) {
            <span class="ml-2 text-sm text-gray-500">
              {{ timestamp() | date: 'short' }}
            </span>
          }
        }
      </div>
      
      <!-- User Request -->
      <div class="mb-2 rounded bg-gray-50 p-3">
        <strong>You:</strong> {{ request() }}
        @if (imageUrl()) {
          <div class="mt-2">
            <img [src]="imageUrl()" alt="Uploaded image" class="max-w-xs rounded border" />
          </div>
        }
      </div>

      <!-- AI Response -->
      <div class="rounded bg-blue-50 p-3">
        <strong>AI:</strong>
        <span class="whitespace-pre-wrap">{{ response() }}</span>
      </div>
    </div>
  `,
})
export class ConversationMessageComponent {
  /** The type of conversation (chat, generate, search, vision) */
  type = input.required<GeminiType>();

  /** User's request message */
  request = input.required<string>();

  /** AI's response message */
  response = input.required<string>();

  /** Timestamp for completed conversations */
  timestamp = input<Date | null>(null);

  /** Whether this conversation is currently loading */
  isLoading = input<boolean>(false);

  /** Image file for vision conversations */
  image = input<File | undefined>(undefined);

  /** Computed image URL for display */
  imageUrl = computed(() => {
    const imageFile = this.image();
    return imageFile ? URL.createObjectURL(imageFile) : null;
  });
}