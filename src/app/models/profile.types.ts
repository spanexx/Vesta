import { UserProfile } from './userProfile.model';

export interface Rates {
  incall: Record<string, number>;
  outcall: Record<string, number>;
  currency: SupportedCurrency;
}

export interface RateType {
  [key: string]: number;
}

export type RateDuration = '30 minutes' | '1 hour' | '2 hours' | '3 hours' | 'overnight';

export type RateFieldPath = `rates.${keyof Rates}.${RateDuration}`;

export type EditableFields = 
  | keyof UserProfile 
  | 'contact.phone'
  | 'contact.country'
  | 'contact.city'
  | 'contact.whatsapp'
  | RateFieldPath
  | 'physicalAttributes.gender'
  | 'physicalAttributes.height'
  | 'physicalAttributes.weight'
  | 'physicalAttributes.ethnicity'
  | 'physicalAttributes.bustSize'
  | 'physicalAttributes.bustType'
  | 'physicalAttributes.pubicHair'
  | 'physicalAttributes.tattoos'
  | 'physicalAttributes.piercings';

export interface EditingState {
  fieldName: EditableFields | null;
  currentValue: string | number | boolean | string[] | ServiceUpdate | null;
}

export interface RoleSelections {
  [key: string]: boolean;
}

export interface ServiceSelections {
  included: Record<string, boolean>;
  extra: Record<string, number | null>;
}

export interface ServiceAccumulator {
  [key: string]: number;
}

export interface ServiceUpdate {
  included: string[];
  extra: Record<string, number>;
}

export type SupportedCurrency = 'EUR' | 'USD' | 'GBP';
