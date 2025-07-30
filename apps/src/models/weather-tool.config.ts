import { FunctionDeclaration, Type } from '@google/genai';
import { Observable, of } from 'rxjs';


export interface WeatherParams {
  location: string;
  unit: 'celsius' | 'fahrenheit';
}

export interface WeatherResult {
  location: string;
  temperature: string;
}


export const currentWeatherToolConfig: FunctionDeclaration = {
  name: "currentWeatherTool",
  description: "Get the current weather in a given location",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING, description: "The city and state, e.g. San Francisco, CA" },
      unit: { type: Type.STRING, enum: ["celsius", "fahrenheit"], description: "The temperature unit to use." },
    },
    required: ["location", "unit"],
  },
};

export function currentWeatherTool(params: WeatherParams): Observable<WeatherResult> {
  const { location, unit } = params;
  return of({
    location,
    temperature: "25°" + (unit.toLowerCase() === "celsius" ? "C" : "F"),
  });
}