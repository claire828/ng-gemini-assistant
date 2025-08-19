# NG Gemini Assistant

A modern Angular application demonstrating integration with Google Gemini AI API, featuring custom function calling (tools) and advanced UI interactions.

## 🚀 Features

### AI Capabilities

- **Text Generation**: General content generation and conversation
- **Web Search**: Internet search functionality powered by Gemini
- **Vision Analysis**: Image upload and AI-powered visual analysis
- **Chat Interface**: Interactive conversation with memory
- **Custom Function Calling**: Weather tool integration as example

### Technical Highlights

- **Angular 20**: Latest Angular version with standalone components
- **Reactive State Management**: Using Angular signals and rxResource
- **OnPush Change Detection**: Optimized performance strategy
- **Custom File Upload**: Styled file input with accessibility support
- **Tailwind CSS**: Modern utility-first styling
- **Nx Workspace**: Monorepo structure with build optimization

## 🛠 Tech Stack

- **Frontend**: Angular 20, TypeScript, RxJS 7
- **Styling**: Tailwind CSS 4
- **Testing**: Jest
- **Build System**: Nx 21.3.11
- **AI Integration**: Google Gemini AI API (@google/genai)
- **State Management**: Angular Signals, NgRx Component

## 📁 Project Structure

```
apps/src/
├── app/
│   ├── components/          # Reusable UI components
│   ├── services/           # Business logic and API integration
│   ├── models/             # Type definitions and interfaces
│   └── utils/              # Utility functions
├── assets/                 # Static assets (icons, images)
└── environments/           # Environment configurations
```

## 🔧 Custom Function Calling (Tools)

This project demonstrates how to implement custom function calling with Gemini AI:

### Weather Tool Example

```typescript
// Define tool configuration
export const currentWeatherToolConfig: FunctionDeclaration = {
  name: 'currentWeatherTool',
  description: 'Get the current weather in a given location',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING, description: 'The city and state' },
      unit: { type: Type.STRING, enum: ['celsius', 'fahrenheit'] },
    },
    required: ['location', 'unit'],
  },
};

// Implement tool function
export function currentWeatherTool(params: WeatherParams): Observable<WeatherResult> {
  const { location, unit } = params;
  return of({
    location,
    temperature: '25°' + (unit.toLowerCase() === 'celsius' ? 'C' : 'F'),
  });
}
```

### Adding New Tools

1. Define tool configuration in `models/your-tool.config.ts`
2. Add types to `models/tool.type.ts`
3. Register in `services/gemini.service.ts`
4. Implement execution logic in `utils/gemini.util.ts`

## 🎨 UI Features

### Custom File Upload

- Accessible design with screen reader support
- Custom styling replacing native file input
- Visual feedback with hover states
- Folder icon integration

### Responsive Design

- Mobile-friendly interface
- Tailwind CSS utility classes
- Flexible layout system

### Interactive Elements

- Button state management (disabled when inappropriate)
- Loading states and feedback
- Conversation history display

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm package manager
- Google Gemini AI API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/claire828/ng-gemini-assistant.git
cd ng-gemini-assistant
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp apps/src/environments/environment.template.ts apps/src/environments/environment.ts
```

4. Add your Gemini AI API key to `environment.ts`:

```typescript
export const environment = {
  production: false,
  geminiApiKey: 'YOUR_API_KEY_HERE',
};
```

### Development

Start the development server:

```bash
npm run ng-gemini-assistant
```

The application will be available at `http://localhost:4306`

### Build

Build for production:

```bash
npm run build
```

## 📚 Key Concepts Demonstrated

### Angular Signals & rxResource

- Reactive state management without complex observables
- Automatic subscription handling
- Computed values and effects

### OnPush Change Detection

- Performance optimization strategies
- Immutable state updates
- Event-driven change detection

### Function Calling with AI

- Custom tool definition and registration
- Observable-based tool execution
- Error handling and response management

### Accessibility

- Semantic HTML structure
- Screen reader compatibility
- Keyboard navigation support
