export interface Rates {
  incall: Record<string, number>;
  outcall: Record<string, number>;
  currency: SupportedCurrency;
}

export interface RateType {
  [key: string]: number;
}

export interface EditingState {
  fieldName: string | null;
  currentValue: any;
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
