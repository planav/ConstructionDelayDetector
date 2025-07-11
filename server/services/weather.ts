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
      console.log("No weather API key found, using default data");
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

    // Clean up location string for better API compatibility
    let cleanLocation = location.trim();

    // Try different location formats if the first one fails
    const locationVariants = [
      cleanLocation,
      cleanLocation.split(',')[0].trim(), // Remove state/country part
      cleanLocation.replace(/\s+/g, '+'), // Replace spaces with +
    ];

    let response;
    let lastError;

    for (const locationVariant of locationVariants) {
      try {
        console.log(`Trying weather API for location: "${locationVariant}"`);
        response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationVariant)}&appid=${apiKey}&units=imperial`
        );

        if (response.ok) {
          console.log(`Weather API success for: "${locationVariant}"`);
          break;
        } else {
          console.log(`Weather API failed for "${locationVariant}": ${response.status}`);
          lastError = new Error(`Weather API error: ${response.status}`);
        }
      } catch (error) {
        console.log(`Weather API error for "${locationVariant}":`, error);
        lastError = error;
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error(`Weather API failed for all location variants`);
    }

    const data = await response.json();
    console.log(`Weather data received for location "${location}":`, {
      temp: data.main.temp,
      condition: data.weather[0].main,
      description: data.weather[0].description
    });

    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      icon: data.weather[0].icon
    };
  } catch (error) {
    console.error(`Error fetching weather data for location "${location}":`, error);

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
