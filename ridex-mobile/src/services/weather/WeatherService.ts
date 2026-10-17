/**
 * RIDEX Weather Radar & Conditions Service
 * Fetches real-time weather, forecast, and riding hazard alerts using Open-Meteo API (0 paid API dependency).
 */

export interface WeatherCondition {
  temperature: number; // °C
  weatherCode: number;
  condition: string;
  icon: string;
  windSpeed: number; // km/h
  windDirection?: number; // degrees
  precipitationProbability: number; // %
  humidity: number; // %
  visibilityKm: number; // km
  isDay: boolean;
  timestamp: string;
}

export interface WeatherAlert {
  id: string;
  severity: 'advisory' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendedAction: string;
}

// WMO Weather interpretation codes (WW)
const WMO_MAP: Record<number, { condition: string; icon: string; hazardSeverity?: 'advisory' | 'warning' | 'critical'; warningText?: string }> = {
  0: { condition: 'Clear Sky', icon: '☀️' },
  1: { condition: 'Mainly Clear', icon: '🌤️' },
  2: { condition: 'Partly Cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Foggy', icon: '🌫️', hazardSeverity: 'advisory', warningText: 'Reduced visibility on mountain sections. Keep fog lamps on.' },
  48: { condition: 'Depositing Rime Fog', icon: '🌫️', hazardSeverity: 'warning', warningText: 'Dense freezing fog. Slow down and maintain high braking distance.' },
  51: { condition: 'Light Drizzle', icon: '🌦️', hazardSeverity: 'advisory', warningText: 'Slightly wet roads. Initial drizzle releases road oils, exercise caution.' },
  53: { condition: 'Moderate Drizzle', icon: '🌧️', hazardSeverity: 'advisory', warningText: 'Wet tarmac. Avoid harsh leaning.' },
  55: { condition: 'Dense Drizzle', icon: '🌧️', hazardSeverity: 'warning', warningText: 'Slippery tarmac. Rain gear recommended.' },
  61: { condition: 'Slight Rain', icon: '🌧️', hazardSeverity: 'advisory', warningText: 'Wet road conditions. Reduce average cornering speed.' },
  63: { condition: 'Moderate Rain', icon: '🌧️', hazardSeverity: 'warning', warningText: 'Active rainfall. Watch out for water puddles and aquaplaning.' },
  65: { condition: 'Heavy Rain', icon: '⛈️', hazardSeverity: 'critical', warningText: 'Heavy downpour. Extreme road slickness, pull over if visibility drops.' },
  71: { condition: 'Slight Snow', icon: '🌨️', hazardSeverity: 'warning', warningText: 'Snow flurries. Low traction.' },
  73: { condition: 'Moderate Snow', icon: '❄️', hazardSeverity: 'critical', warningText: 'Snow accumulation. High risk for 2-wheelers.' },
  75: { condition: 'Heavy Snow', icon: '❄️', hazardSeverity: 'critical', warningText: 'Severe snowfall hazard. Not safe for riding.' },
  80: { condition: 'Light Showers', icon: '🌦️' },
  81: { condition: 'Moderate Showers', icon: '🌧️', hazardSeverity: 'advisory', warningText: 'Passing rain showers.' },
  82: { condition: 'Violent Rain Showers', icon: '⛈️', hazardSeverity: 'critical', warningText: 'Torrential cloudburst showers. Seek covered shelter.' },
  95: { condition: 'Thunderstorm', icon: '⛈️', hazardSeverity: 'critical', warningText: 'Thunderstorm and lightning. Avoid high open ridges and metal poles.' },
  96: { condition: 'Thunderstorm with Hail', icon: '🌩️', hazardSeverity: 'critical', warningText: 'Severe thunderstorm with hail. Stop ride immediately in covered area.' },
  99: { condition: 'Heavy Hailstorm', icon: '🌩️', hazardSeverity: 'critical', warningText: 'Severe hailstorm danger. Helmet visor damage risk, seek shelter.' }
};

class WeatherServiceImpl {
  private cache: Map<string, { data: WeatherCondition; expiresAt: number }> = new Map();

  /**
   * Fetch current live weather for given coordinates
   */
  async getWeather(lat: number, lng: number): Promise<WeatherCondition> {
    const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=precipitation_probability,relativehumidity_2m,visibility,windspeed_10m&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const json = await response.json();
      const current = json.current_weather;
      const hourly = json.hourly;

      const code = current?.weathercode ?? 0;
      const wmo = WMO_MAP[code] || { condition: 'Fair', icon: '🌤️' };

      // Current hour index
      const hourIdx = 0;
      const precipProb = hourly?.precipitation_probability ? hourly.precipitation_probability[hourIdx] || 0 : 0;
      const humidity = hourly?.relativehumidity_2m ? hourly.relativehumidity_2m[hourIdx] || 50 : 50;
      const visibilityMeters = hourly?.visibility ? hourly.visibility[hourIdx] || 10000 : 10000;

      const weatherCondition: WeatherCondition = {
        temperature: Math.round(current?.temperature ?? 26),
        weatherCode: code,
        condition: wmo.condition,
        icon: wmo.icon,
        windSpeed: Math.round(current?.windspeed ?? 12),
        windDirection: current?.winddirection,
        precipitationProbability: precipProb,
        humidity: Math.round(humidity),
        visibilityKm: Math.round(visibilityMeters / 100) / 10,
        isDay: current?.is_day === 1,
        timestamp: new Date().toISOString()
      };

      // Cache for 10 minutes
      this.cache.set(cacheKey, {
        data: weatherCondition,
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      return weatherCondition;
    } catch (error) {
      console.warn('Weather fetch failed, falling back to nominal weather:', error);
      return {
        temperature: 27,
        weatherCode: 1,
        condition: 'Clear & Sunny',
        icon: '☀️',
        windSpeed: 14,
        precipitationProbability: 10,
        humidity: 45,
        visibilityKm: 10,
        isDay: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Evaluate hazards for riders from weather data
   */
  evaluateAlerts(weather: WeatherCondition): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];

    // Check WMO mapping alert
    const wmo = WMO_MAP[weather.weatherCode];
    if (wmo?.hazardSeverity && wmo.warningText) {
      alerts.push({
        id: `wmo-${weather.weatherCode}`,
        severity: wmo.hazardSeverity,
        title: `${wmo.condition} Alert`,
        description: wmo.warningText,
        recommendedAction: wmo.hazardSeverity === 'critical' ? 'Pause ride and seek shelter' : 'Reduce speed and maintain high distance'
      });
    }

    // High Wind Warning (> 40 km/h)
    if (weather.windSpeed >= 40) {
      alerts.push({
        id: 'wind-high',
        severity: weather.windSpeed >= 55 ? 'critical' : 'warning',
        title: `High Wind Gusts (${weather.windSpeed} km/h)`,
        description: 'Strong crosswinds can destabilize motorcycle balance on open highways and flyovers.',
        recommendedAction: 'Grip tank firmly with knees, lean into crosswind gusts, avoid high speed overtaking.'
      });
    }

    // High Rain Probability (> 60%)
    if (weather.precipitationProbability >= 60 && !alerts.some(a => a.id.startsWith('wmo-'))) {
      alerts.push({
        id: 'rain-prob-high',
        severity: weather.precipitationProbability >= 85 ? 'warning' : 'advisory',
        title: `${weather.precipitationProbability}% Chance of Rain`,
        description: 'Wet road surfaces imminent along your planned route.',
        recommendedAction: 'Keep waterproofs accessible, increase braking distance by 2x.'
      });
    }

    // Extreme Temperature (> 40°C or < 5°C)
    if (weather.temperature >= 40) {
      alerts.push({
        id: 'heat-alert',
        severity: 'warning',
        title: `High Heat Advisory (${weather.temperature}°C)`,
        description: 'Dehydration and rider fatigue risk elevated on long open stretches.',
        recommendedAction: 'Hydrate with electrolytes every 45 minutes; take shaded rest breaks.'
      });
    } else if (weather.temperature <= 6) {
      alerts.push({
        id: 'cold-alert',
        severity: 'warning',
        title: `Cold Weather Warning (${weather.temperature}°C)`,
        description: 'Cold hands reduce clutch/brake reaction times. Tyres take longer to warm up.',
        recommendedAction: 'Wear thermal windbreakers and winter riding gloves. Check tyre pressures.'
      });
    }

    return alerts;
  }
}

export const WeatherService = new WeatherServiceImpl();
