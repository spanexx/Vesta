import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly fallbackLocation = {
    latitude: 40.7128, // New York City
    longitude: -74.006,
    city: 'New York',
    country: 'USA'
  };

  constructor(private http: HttpClient) {}

  /**
   * Get default fallback location.
   */
  getDefaultLocation(): { latitude: number; longitude: number; city: string; country: string } {
    return { ...this.fallbackLocation };
  }

  /**
   * Get precise user location.
   */
  async getPreciseLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GEOLOCATION_UNSUPPORTED'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('PERMISSION_DENIED'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('POSITION_UNAVAILABLE'));
              break;
            case error.TIMEOUT:
              reject(new Error('TIMEOUT'));
              break;
            default:
              reject(new Error('UNKNOWN_ERROR'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Reverse Geocode: Convert Latitude & Longitude to City & Country.
   */
  async getCityAndCountry(latitude: number, longitude: number): Promise<{ city: string, country: string }> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
      const response: any = await this.http.get(url).toPromise();

      const city = response.address.city || response.address.town || response.address.village || 'Unknown';
      const country = response.address.country || 'Unknown';

      return { city, country };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return { city: 'Unknown', country: 'Unknown' };
    }
  }

  /**
   * Get Smart Location: Fetch precise location and then get city/country.
   */
  async getSmartLocation(): Promise<{
    location: { latitude: number; longitude: number; city: string; country: string };
    isFallback: boolean;
  }> {
    try {
      const { latitude, longitude } = await this.getPreciseLocation();
      const { city, country } = await this.getCityAndCountry(latitude, longitude);

      return {
        location: { latitude, longitude, city, country },
        isFallback: false
      };
    } catch (error) {
      console.warn('Geolocation unavailable, using fallback location:', error);
      return {
        location: { ...this.fallbackLocation },
        isFallback: true
      };
    }
  }
}
