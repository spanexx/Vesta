import { Rates } from '../../models/profile.types';

export function getRateDurations(rates: Rates): string[] {
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

export function validateRateValue(value: string): { isValid: boolean; value?: number; error?: string } {
  const rateValue = parseFloat(value);
  if (isNaN(rateValue) || rateValue < 0) {
    return { isValid: false, error: 'Please enter a valid rate' };
  }
  return { isValid: true, value: rateValue };
}
