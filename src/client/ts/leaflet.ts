/*eslint-disable */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
type leafletLocation = {
  coordinates: [number, number];
  [key: string]: any;
};
export const createMap = (locations: leafletLocation) => {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    console.error('No valid locations provided for the map');
    return;
  }

  try {
    // Initialize map with default view
    const map = L.map('map', {
      zoomControl: false,
      scrollWheelZoom: false,
      preferCanvas: false
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    }).addTo(map);

    // Custom marker icon
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="marker"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    // Add markers and calculate bounds
    const coordsArr: [number, number][] = locations.map((loc) => {
      const coordinates = loc.coordinates;
      const coords: [number, number] = coordinates.reverse();
      return coords;
    });

    const bounds: [number, number][] = [];
    coordsArr.forEach((coord: [number, number], i: number) => {
      const marker = L.marker(coord, {
        icon: customIcon
      }).addTo(map);
      const popup = L.popup({
        content: `Day ${i + 1}`,
        keepInView: true
      });
      marker.bindPopup(popup);
      bounds.push(coord);
    });

    if (coordsArr.length > 1) {
      const polyline = L.polyline(bounds, {
        color: '#55c57a',
        weight: 3,
        opacity: 0.8,
        lineJoin: 'round'
      }).addTo(map);
      // Fit map to polyline bounds
      map.fitBounds(polyline.getBounds(), {
        padding: [50, 50],
        maxZoom: 15
      });
    } else {
      map.setView(coordsArr[0], 13);
    }
  } catch (error) {
    console.error('Error initializing map:', error);
    throw error; // Re-throw to allow error handling in the calling code
  }
};
