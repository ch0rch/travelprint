import MapHandler from '../js/map.js';
import PaymentHandler from '../js/payment.js';

class TravelPrintApp {
  constructor() {
    // Inicializar estado de la aplicación
    this.state = {
      title: 'Mi viaje por Chile',
      lineColor: '#4F46E5',
      mapStyle: 'mapbox://styles/mapbox/streets-v12'
    };
  
    // Cargar datos guardados si existen
    this.loadSavedState();
  
    // Inicializar manejadores después de cargar el estado
    this.mapHandler = new MapHandler({
      mapContainer: 'map',
      style: this.state.mapStyle,
      lineColor: this.state.lineColor,
      destinations: this.state.destinations || []
    });
    
    this.paymentHandler = new PaymentHandler();
  }

  init() {
    mapboxgl.accessToken = this.mapboxToken;
    
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: this.style,
      center: [-70.6693, -33.4489], // Santiago, Chile por defecto
      zoom: 5,
      attributionControl: false
    });
  
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
  }

  setupEventListeners() {
    // Listener para añadir destino
    const addBtn = document.getElementById('addDestinationBtn');
    const destInput = document.getElementById('destinationInput');
    
    addBtn.addEventListener('click', () => this.addDestination());
    destInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addDestination();
    });

    // Listener para cambio de estilo de mapa
    document.getElementById('mapStyle').addEventListener('change', (e) => {
      this.updateMapStyle(e.target.value);
    });

    // Listener para cambio de color de línea
    document.getElementById('lineColor').addEventListener('input', (e) => {
      this.updateLineColor(e.target.value);
    });

    // Listener para cambio de título
    document.getElementById('stampTitle').addEventListener('input', (e) => {
      this.updateTitle(e.target.value);
    });

    // Listeners para botones de descarga
    document.getElementById('downloadFreeBtn').addEventListener('click', () => {
      this.downloadStamp(false);
    });

    document.getElementById('downloadPremiumBtn').addEventListener('click', () => {
      this.downloadPremiumStamp();
    });
  }

  async addDestination() {
    const input = document.getElementById('destinationInput');
    const destination = input.value.trim();
    
    if (destination) {
      const added = await this.mapHandler.addDestination(destination);
      
      if (added) {
        input.value = '';
        this.updateDestinationsList();
        this.updatePreviewDestinations();
        this.saveState();
      } else {
        alert('No se pudo encontrar ese destino. Intenta con otro nombre.');
      }
    }
  }

  removeDestination(index) {
    if (this.mapHandler.removeDestination(index)) {
      this.updateDestinationsList();
      this.updatePreviewDestinations();
      this.saveState();
    }
  }

  updateMapStyle(style) {
    this.state.mapStyle = style;
    this.mapHandler.updateStyle(style);
    this.saveState();
  }

  updateLineColor(color) {
    this.state.lineColor = color;
    this.mapHandler.updateLineColor(color);
    this.saveState();
  }

  updateTitle(title) {
    this.state.title = title || 'Mi viaje';
    document.getElementById('previewTitle').textContent = this.state.title;
    this.saveState();
  }

  updateDestinationsList() {
    const listEl = document.getElementById('destinationsList');
    listEl.innerHTML = '';
    
    this.mapHandler.destinations.forEach((dest, index) => {
      const item = document.createElement('li');
      item.className = 'py-3 flex justify-between items-center';
      item.innerHTML = `
        <span class="font-medium">${dest.name}</span>
        <button class="text-red-500 hover:text-red-700" data-index="${index}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      `;
      
      // Añadir event listener para eliminar destino
      item.querySelector('button').addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.removeDestination(index);
      });
      
      listEl.appendChild(item);
    });
  }

  updatePreviewDestinations() {
    const destText = this.mapHandler.getDestinationsString() || 'Añade destinos para ver tu ruta';
    document.getElementById('previewDestinations').textContent = destText;
  }

  updateUI() {
    // Actualizar campos de formulario
    document.getElementById('mapStyle').value = this.state.mapStyle;
    document.getElementById('lineColor').value = this.state.lineColor;
    document.getElementById('stampTitle').value = this.state.title;
    
    // Actualizar previsualización
    document.getElementById('previewTitle').textContent = this.state.title;
    this.updateDestinationsList();
    this.updatePreviewDestinations();
  }

  async downloadStamp(isPremium = false) {
    // Verificar si hay destinos
    if (this.mapHandler.destinations.length < 2) {
      alert('Añade al menos 2 destinos para crear tu estampita');
      return;
    }
  
    try {
      // Esperar a que el mapa esté completamente cargado
      if (!this.mapHandler.map.loaded()) {
        await new Promise(resolve => {
          this.mapHandler.map.once('idle', resolve);
        });
      }
  
      // Capturar el div de previsualización como imagen
      const stampElement = document.getElementById('stampPreview');
      
      // Mostrar/ocultar marca de agua según versión
      const watermark = document.getElementById('watermark');
      watermark.style.opacity = isPremium ? '0' : '1';
      watermark.textContent = isPremium ? '' : 'TravelPrint.me - Versión gratuita';
      
      // Crear una promesa para html2canvas
      const canvas = await html2canvas(stampElement, {
        scale: 2, // Mayor resolución
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      // Restaurar marca de agua para la UI
      watermark.style.opacity = '0.8';
      watermark.textContent = 'TravelPrint.me';
      
      // Convertir a imagen y descargar
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `travelprint-${this.state.title.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar la estampita:', error);
      alert('Hubo un error al generar la imagen. Inténtalo de nuevo.');
    }
  }

  async downloadPremiumStamp() {
    try {
      // Preparar datos para el pago
      const customData = {
        title: this.state.title,
        destinations: this.mapHandler.destinations.map(d => d.name).join(',')
      };
      
      // Iniciar proceso de pago
      const paymentInitiated = await this.paymentHandler.initiatePayment(customData);
      
      if (paymentInitiated) {
        // El proceso de pago aquí sería redirigir al usuario a LemonSqueezy
        // Normalmente, se verificaría el pago mediante un webhook o callback
        
        // Para fines del MVP, asumimos éxito después de iniciar
        // En una implementación real, se verificaría el pago antes de descargar
        setTimeout(() => {
          // Simular verificación de pago exitosa (solo para demo)
          // En la implementación real, esto sería manejado por webhooks de LemonSqueezy
          const shouldProceed = confirm('¿Completaste el pago? (Esto es solo para demostración, en la versión final será automático)');
          if (shouldProceed) {
            this.downloadStamp(true);
          }
        }, 500);
      } else {
        alert('No se pudo iniciar el proceso de pago. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error en el proceso de pago:', error);
      alert('Hubo un error al procesar el pago. Inténtalo de nuevo.');
    }
  }

  saveState() {
    // Guardar estado en localStorage
    const savedState = {
      title: this.state.title,
      lineColor: this.state.lineColor,
      mapStyle: this.state.mapStyle,
      destinations: this.mapHandler.destinations
    };
    
    localStorage.setItem('travelprint_state', JSON.stringify(savedState));
  }

  loadSavedState() {
    const savedData = localStorage.getItem('travelprint_state');
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        
        // Actualizar estado
        this.state.title = parsed.title || this.state.title;
        this.state.lineColor = parsed.lineColor || this.state.lineColor;
        this.state.mapStyle = parsed.mapStyle || this.state.mapStyle;
        
        // Actualizar destinos
        if (parsed.destinations && Array.isArray(parsed.destinations)) {
          this.mapHandler.destinations = parsed.destinations;
        }
      } catch (error) {
        console.error('Error al cargar datos guardados:', error);
      }
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const app = new TravelPrintApp();
  app.init();
});