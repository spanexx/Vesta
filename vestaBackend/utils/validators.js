export const validateRequiredFields = (body, requiredFields) => {
  const missingFields = requiredFields.filter(field => !body[field]);
  return missingFields.length > 0 
    ? { isValid: false, errors: missingFields.map(field => `${field} is required`) }
    : { isValid: true };
};

export const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) 
    ? { isValid: true }
    : { isValid: false, error: 'Invalid email format' };
};

export const validateAge = (birthdate, minAge = 18) => {
  const birthDate = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= minAge
    ? { isValid: true }
    : { isValid: false, error: `Must be at least ${minAge} years old` };
};