import { ServiceSelections, ServiceAccumulator, ServiceUpdate } from '../../models/profile.types';
import { UserProfile } from '../../models/userProfile.model';

export function initializeServiceSelections(
  availableServices: string[],
  currentSelections: ServiceSelections,
  profile?: UserProfile
): ServiceSelections {
  return {
    included: availableServices.reduce((acc, service) => {
      acc[service] = currentSelections.included[service] || 
                    profile?.services?.included?.includes(service) || 
                    false;
      return acc;
    }, {} as Record<string, boolean>),
    extra: availableServices.reduce((acc, service) => {
      acc[service] = currentSelections.extra[service] || 
                    profile?.services?.extra?.[service] || 
                    null;
      return acc;
    }, {} as Record<string, number | null>)
  };
}

export function createServiceUpdate(serviceSelections: ServiceSelections): ServiceUpdate {
  return {
    included: Object.keys(serviceSelections.included)
      .filter(key => serviceSelections.included[key]),
    extra: Object.entries(serviceSelections.extra)
      .reduce<ServiceAccumulator>((acc, [key, value]) => {
        if (value && value > 0) {
          acc[key] = value;
        }
        return acc;
      }, {} as ServiceAccumulator)
  };
}
