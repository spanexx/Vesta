import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfile } from '../models/userProfile.model';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private profilesCache = new BehaviorSubject<UserProfile[]>([]);
  private cacheTimestamp: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private profileCache = new Map<string, {
    data: UserProfile;
    timestamp: number;
    expiresIn: number;
  }>();

  setProfiles(profiles: UserProfile[]): void {
    this.profilesCache.next(profiles);
    this.cacheTimestamp = Date.now();
  }

  getProfiles(): Observable<UserProfile[]> {
    return this.profilesCache.asObservable();
  }

  isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
  }

  clearCache(): void {
    this.profilesCache.next([]);
    this.cacheTimestamp = 0;
  }

  cacheProfile(profile: UserProfile, expiresIn: number = 5 * 60 * 1000): void {
    this.profileCache.set(profile._id, {
      data: profile,
      timestamp: Date.now(),
      expiresIn
    });
  }

  getProfileById(id: string): UserProfile | null {
    const cached = this.profileCache.get(id);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.expiresIn) {
      this.profileCache.delete(id);
      return null;
    }
    
    return cached.data;
  }

  clearProfileCache(): void {
    this.profileCache.clear();
  }
}
