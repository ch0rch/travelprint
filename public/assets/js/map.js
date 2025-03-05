class MapHandler {
  constructor(options = {}) {
    this.mapboxToken = 'pk.eyJ1Ijoiam9yamVyb2phcyIsImEiOiJjbTd2eG42bXYwMTNlMm1vcWRycWpicmRhIn0.hDwomrUtCTWGe0gtLHil2Q';
    this.mapContainer = options.mapContainer || 'map';
    this.style = options.style || 'mapbox://styles/mapbox/streets-v12';
    this.lineColor = options.lineColor || '#4F46E5';
    this.destinations = options.destinations || [];
    this.map = null;
    this.routeSource = null;
  }

  init() {
    try {
      console.log('Inicializando mapa con token:', this.mapboxToken);
      console.log('Contenedor del mapa:', this.mapContainer);
      
      mapboxgl.accessToken = this.mapboxToken;
      
      this.map = new mapboxgl.Map({
        container: this.mapContainer,
        style: this.style,
        center: [-70.6693, -33.4489], // Santiago, Chile por defecto
        zoom: 5,
        attributionControl: false
      });

      console.log('Mapa creado, esperando evento load');
      
      this.map.on('load', () => {
        console.log('Mapa cargado correctamente');
        // Añadir una fuente de datos para la ruta
        this.map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });
        
        // Añadir una capa para la línea de la ruta
        this.map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': this.lineColor,
            'line-width': 4
          }
        });

        // Añadir una capa para los puntos de destino
        this.map.addLayer({
          id: 'points',
          type: 'circle',
          source: 'route',
          paint: {
            'circle-radius': 6,
            'circle-color': this.lineColor
          },
          filter: ['in', '$type', 'Point']
        });

        this.routeSource = this.map.getSource('route');
        
        // Si hay destinos iniciales, actualizamos la ruta
        if (this.destinations.length > 0) {
          this.updateRoute();
        }
      });
      
      this.map.on('error', (e) => {
        console.error('Error en el mapa:', e);
      });
    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
  }

  async updateStyle(style) {
    this.style = style;
    this.map.setStyle(style);
    
    // Volver a añadir las capas después de cambiar el estilo
    this.map.once('styledata', () => {
      if (this.map.getSource('route')) return;
      
      this.map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });
      
      this.map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': this.lineColor,
          'line-width': 4
        }
      });

      this.map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'route',
        paint: {
          'circle-radius': 6,
          'circle-color': this.lineColor
        },
        filter: ['in', '$type', 'Point']
      });

      this.routeSource = this.map.getSource('route');
      
      if (this.destinations.length > 0) {
        this.updateRoute();
      }
    });
  }

  updateLineColor(color) {
    this.lineColor = color;
    if (this.map && this.map.isStyleLoaded()) {
      this.map.setPaintProperty('route', 'line-color', color);
      this.map.setPaintProperty('points', 'circle-color', color);
    }
  }

  async addDestination(destination) {
    try {
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${this.mapboxToken}&limit=1`;
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const coords = data.features[0].geometry.coordinates;
        this.destinations.push({
          name: destination,
          coordinates: coords
        });
        this.updateRoute();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al geocodificar destino:', error);
      return false;
    }
  }

  removeDestination(index) {
    if (index >= 0 && index < this.destinations.length) {
      this.destinations.splice(index, 1);
      this.updateRoute();
      return true;
    }
    return false;
  }

  updateRoute() {
    if (!this.map || !this.routeSource || this.destinations.length === 0) return;
    
    const coordinates = this.destinations.map(dest => dest.coordinates);
    
    // Para el mapa interactivo, necesitamos crear una ruta con puntos adicionales para simular curvas
    const curvedCoordinates = [];
    
    if (coordinates.length >= 2) {
      // Añadir el primer punto
      curvedCoordinates.push(coordinates[0]);
      
      // Para cada par de puntos consecutivos, añadir un punto intermedio curvado
      for (let i = 0; i < coordinates.length - 1; i++) {
        const start = coordinates[i];
        const end = coordinates[i + 1];
        
        // Crear un punto intermedio ligeramente desplazado del centro directo
        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;
        
        // Calcular un desplazamiento perpendicular para crear la curva
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        
        // Factor de curvatura - ajustar según necesidad
        const curveFactor = 0.2;
        
        // Punto perpendicular (rotación de 90 grados)
        const perpX = midX - dy * curveFactor;
        const perpY = midY + dx * curveFactor;
        
        // Añadir punto intermedio y punto final
        curvedCoordinates.push([perpX, perpY]);
        curvedCoordinates.push(end);
      }
    } else {
      // Si solo hay un punto, usarlo directamente
      curvedCoordinates.push(...coordinates);
    }
    
    // Actualizar la fuente de datos con la ruta curvada
    this.routeSource.setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: curvedCoordinates
      }
    });
    
    // Añadir marcadores para cada destino
    // Primero, eliminar marcadores existentes
    this.destinations.forEach((dest, index) => {
      const markerId = `marker-${index}`;
      const existingMarker = document.getElementById(markerId);
      if (existingMarker) existingMarker.remove();
    });
    
    // Luego, añadir nuevos marcadores
    this.destinations.forEach((dest, index) => {
      // Crear un elemento para el marcador
      const el = document.createElement('div');
      el.id = `marker-${index}`;
      el.className = 'mapboxgl-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = this.lineColor;
      el.style.border = '2px solid white';
      el.style.display = 'flex';
      el.style.justifyContent = 'center';
      el.style.alignItems = 'center';
      el.style.color = 'white';
      el.style.fontWeight = 'bold';
      el.style.fontSize = '14px';
      el.innerHTML = String.fromCharCode(65 + (index % 26)); // Letras en mayúscula (A, B, C...)
      
      // Añadir el marcador al mapa
      new mapboxgl.Marker(el)
        .setLngLat(dest.coordinates)
        .addTo(this.map);
    });
    
    // Ajustar el mapa para mostrar toda la ruta
    if (coordinates.length > 1) {
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
      
      this.map.fitBounds(bounds, {
        padding: 50,
        duration: 1000
      });
    } else if (coordinates.length === 1) {
      this.map.flyTo({
        center: coordinates[0],
        zoom: 10,
        duration: 1000
      });
    }
  }
}