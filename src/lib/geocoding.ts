export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  postalCode?: string;
  name?: string;
}

export async function geocodeLocation(query: string): Promise<GeocodeResult> {
  if (!window.google) throw new Error('Google Maps not loaded');

  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address: query.trim() }, (results, status) => {
      if (status !== 'OK' || !results || results.length === 0) {
        reject(new Error('Location not found. Please check the address and try again.'));
        return;
      }

      const result = results[0];
      const postalComponent = result.address_components.find((c) =>
        c.types.includes('postal_code')
      );

      resolve({
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
        formattedAddress: result.formatted_address,
        postalCode: postalComponent?.long_name,
        name: query,
      });
    });
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  if (!window.google) throw new Error('Google Maps not loaded');

  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results || results.length === 0) {
        reject(new Error('Unable to find address for this location.'));
        return;
      }

      const result = results[0];
      const postalComponent = result.address_components.find((c) =>
        c.types.includes('postal_code')
      );

      resolve({
        lat,
        lng,
        formattedAddress: result.formatted_address,
        postalCode: postalComponent?.long_name,
      });
    });
  });
}
