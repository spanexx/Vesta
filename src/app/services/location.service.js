class LocationService {
  async getLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        resolve({ latitude, longitude });
      }, error => {
        reject(error);
      });
    });
  }
}

export default LocationService;