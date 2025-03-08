// Common country codes (you can expand this list)
const commonCountryCodes = {
  CY: '357',  // Cyprus
  US: '1',    // United States
  UK: '44',   // United Kingdom
  DE: '49',   // Germany
  FR: '33',   // France
  // Add more as needed
};

export function formatWhatsAppNumber(number: string): string {
  // Remove all non-numeric characters
  const cleanNumber = number.replace(/\D/g, '');
  
  // Check if number already starts with a country code
  for (const code of Object.values(commonCountryCodes)) {
    if (cleanNumber.startsWith(code)) {
      return cleanNumber;
    }
  }
  
  // Try to detect country code from number format
  if (cleanNumber.length === 8) {
    // Cyprus mobile numbers are 8 digits
    return `357${cleanNumber}`;
  } else if (cleanNumber.length === 10) {
    // US/Canada numbers are 10 digits
    return `1${cleanNumber}`;
  } else if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
    // UK numbers often start with 0
    return `44${cleanNumber.substring(1)}`;
  }
  
  // If no specific format is detected, return as-is
  return cleanNumber;
}

export function generateWhatsAppLink(number: string, message?: string): string {
  const formattedNumber = formatWhatsAppNumber(number);
  const baseUrl = 'https://wa.me/';
  
  if (message) {
    return `${baseUrl}${formattedNumber}?text=${encodeURIComponent(message)}`;
  }
  
  return `${baseUrl}${formattedNumber}`;
}
