import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly fallbackLocation = {
    latitude: 40.7128, // New York City
    longitude: -74.006
  };

  constructor() {}

  /**
   * Get precise user location with explicit permission handling
   */
  async getPreciseLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GEOLOCATION_UNSUPPORTED'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        error => {
          switch(error.code) {
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
          timeout: 10000, // 10 seconds
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Get default fallback location (New York City)
   */
  getDefaultLocation(): { latitude: number; longitude: number } {
    return { ...this.fallbackLocation };
  }

  /**
   * Smart location fetcher with permission awareness
   */
  async getSmartLocation(): Promise<{ 
    location: { latitude: number; longitude: number },
    isFallback: boolean 
  }> {
    try {
      return {
        location: await this.getPreciseLocation(),
        isFallback: false
      };
    } catch (error) {
      console.warn('Location fetch failed:', error);
      return {
        location: this.getDefaultLocation(),
        isFallback: true
      };
    }
  }
}