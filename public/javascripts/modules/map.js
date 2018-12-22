import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: { lat: 38.7, lng: -120.7 },
  zoom: 10
};

function loadPlaces(map, lat = 38.7, lng = -120.7) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`).then(res => {
    const places = res.data;
    console.log(places);
    if (!places.length) {
      alert('no places found!');
      return;
    }

    //create a bounds
    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    const markers = places.map(place => {
      const [placeLng, placeLat] = place.location.coordinates;
      const position = { lat: placeLat, lng: placeLng };
      bounds.extend(position);
      const marker = new google.maps.Marker({
        map,
        position
      });
      marker.place = place;
      return marker;
    });

    // When somone clicks marker show details of marker
    markers.forEach(marker =>
      marker.addListener('click', function() {
        const html = `
        <div class="popup">
          <a href="/store/${this.place.slug}">
            <img src="/uploads/${this.place.photo || 'store.jpg'}" alt="${
          this.place.name
        }" />
            <p>${this.place.name} = ${this.place.location.address}</p>
          </a>
        </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      })
    );

    //zoom map to fit markers
    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);
  });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;
  //make map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);
  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(
      map,
      place.geometry.location.lat(),
      place.geometry.location.lng()
    );
  });
}

export default makeMap;
