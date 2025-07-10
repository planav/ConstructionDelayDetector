export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export async function getWeatherData(location: string): Promise<WeatherData> {
  try {
    // Using OpenWeatherMap API
    const apiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY || "";
    
    if (!apiKey) {
      // Return default weather data if no API key
      return {
        temperature: 72,
        condition: "Clear",
        description: "Clear sky",
        humidity: 50,
        windSpeed: 5,
        icon: "01d"
      };
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=imperial`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      icon: data.weather[0].icon
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    
    // Return default weather data on error
    return {
      temperature: 72,
      condition: "Clear",
      description: "Weather data unavailable",
      humidity: 50,
      windSpeed: 5,
      icon: "01d"
    };
  }
}
