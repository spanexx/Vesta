export function calculateAge(birthdate: Date | string): number {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatLocation(coordinates: [number, number]): string {
  return `${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`;
}
