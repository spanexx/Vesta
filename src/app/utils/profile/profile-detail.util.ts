import { UserProfile } from '../../models/userProfile.model';
import { calculateAge } from './profile-calculations.util';

export function getLikeButtonTitle(
  isAuthenticated: boolean,
  isCurrentUser: boolean
): string {
  if (!isAuthenticated) return 'Login to like this profile';
  if (isCurrentUser) return 'You cannot like your own profile';
  return 'Like this profile';
}

export function getCoordinates(profile: UserProfile): [number, number] | undefined {
  if (profile.contact?.location?.coordinates && 
      Array.isArray(profile.contact.location.coordinates) && 
      profile.contact.location.coordinates.length === 2) {
    return profile.contact.location.coordinates as [number, number];
  }
  return undefined;
}

export function getWhatsAppLink(phoneNumber: string, defaultMessage?: string): string {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const baseUrl = `https://wa.me/${cleanNumber}`;
  if (defaultMessage) {
    return `${baseUrl}?text=${encodeURIComponent(defaultMessage)}`;
  }
  return baseUrl;
}

export function getMediaType(url: string): 'image' | 'video' {
  const videoExtensions = ['.mp4', '.webm', '.ogg'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) ? 'video' : 'image';
}

export function getIncludedServices(profile: UserProfile): string[] {
  return profile.services?.included || [];
}

export function getExtraServices(profile: UserProfile): { service: string; price: number }[] {
  if (!profile.services?.extra) return [];
  
  return Object.entries(profile.services.extra)
    .map(([service, price]) => ({
      service,
      price: Number(price)
    }))
    .filter(item => !isNaN(item.price));
}

export const availableRoles = [
  { value: 'girlfriend', label: 'Girlfriend' },
  { value: 'wife', label: 'Wife' }, 
  { value: 'mistress', label: 'Mistress' },
  { value: 'pornstar', label: 'Pornstar' },
  { value: 'onenight', label: 'One Night' }
];

export const availableServices = [
  // Basic Services
  'Classic vaginal sex', 'Sex Toys', 'Striptease', 'Uniforms', '69 position', 
  'Cum in face', 'Cum in mouth', 'Cum on body', 'Deepthroat', 'Domination', 
  'Erotic massage', 'Erotic Photos', 'Foot fetish', 'French kissing', 
  'Golden shower give', 'Group sex', 'Oral without condom', 'With 2 men',
  // Pornstar Services
  'Video Recording', 'Photo Shooting', 'Live Cam Show', 'Adult Film Production',
  'Private Show', 'Professional Photos', 'Explicit Content Creation',
  // Mistress Services
  'BDSM', 'Role Play', 'Spanking', 'Bondage', 'Fetish', 'Slave Training',
  'Discipline', 'Humiliation', 'Rope Play', 'Wax Play',
  // Girlfriend Experience
  'Dinner Date', 'Overnight Stay', 'Weekend Trip', 'Social Events',
  'Romantic Evening', 'Cuddling', 'Dating', 'Travel Companion',
  'Dancing', 'Shopping Together'
];

export interface RateType {
  incall: Record<string, number>;
  outcall: Record<string, number>;
  currency?: string;
}

export function getRateDurations(rates: RateType): string[] {
  const allDurations = new Set<string>();
  Object.keys(rates.incall || {}).forEach(d => allDurations.add(d));
  Object.keys(rates.outcall || {}).forEach(d => allDurations.add(d));
  return Array.from(allDurations).sort((a, b) => {
    const getHours = (duration: string) => {
      const match = duration.match(/(\d+)/);
      return match ? parseInt(match[0]) : 0;
    };
    return getHours(a) - getHours(b);
  });
}

export function isEditing(editingState: { fieldName: string | null }, fieldName: string): boolean {
  return editingState.fieldName === fieldName;
}

export function formatBirthday(birthdate: string | Date): number {
  return calculateAge(birthdate);
}

export function createServiceUpdate(
  included: string[],
  extra: Record<string, number | null>
): { included: string[]; extra: Record<string, number> } {
  const cleanExtra = Object.entries(extra)
    .reduce<Record<string, number>>((acc, [key, value]) => {
      if (value && value > 0) acc[key] = value;
      return acc;
    }, {});

  return {
    included,
    extra: cleanExtra
  };
}

export function handleServiceSelection(
  service: string,
  event: Event,
  current: { included: string[]; extra: Record<string, number> }
): { included: string[]; extra: Record<string, number> } {
  const isChecked = (event.target as HTMLInputElement).checked;
  let included = [...current.included];
  let extra = { ...current.extra };

  if (isChecked) {
    included = [...included, service];
    delete extra[service];
  } else {
    included = included.filter(s => s !== service);
  }

  return { included, extra };
}

export function initializeProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    physicalAttributes: profile.physicalAttributes || {
      gender: 'female',
      height: 165,
      weight: 55,
      ethnicity: 'Other',
      bustSize: '',
      bustType: 'Natural',
      pubicHair: 'Shaved',
      tattoos: false,
      piercings: false
    },
    services: profile.services || {
      included: [],
      extra: {}
    },
    availableToMeet: profile.availableToMeet || {
      meetingWith: [],
      available24_7: false,
      advanceBooking: false
    }
  };
}

