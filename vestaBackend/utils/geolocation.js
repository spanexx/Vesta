// Function to calculate distance between two points
function calculateDistance(point1, point2) {
  const lat1 = point1[1];
  const lon1 = point1[0];
  const lat2 = point2[1];
  const lon2 = point2[0];
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c;
  return distance;
}

// Function to convert degrees to radians
function toRad(x) {
  return x * Math.PI / 180;
}

export { calculateDistance };