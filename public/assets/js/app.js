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
    // Inicializar mapa
    this.mapHandler.init();
    
    // Configurar event listeners
    this.setupEventListeners();
    
    // Actualizar UI con estado inicial
    this.updateUI();
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
      // Crear un div temporal para la estampita
      const tempDiv = document.createElement('div');
      tempDiv.className = 'relative border-8 border-indigo-100 rounded-lg overflow-hidden';
      tempDiv.style.width = '400px';  // Ajustar según necesidades
      
      // Obtener coordenadas y crear una ruta para la imagen estática de Mapbox
      const coordinates = this.mapHandler.destinations.map(dest => dest.coordinates);
      const center = coordinates.reduce((acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]], [0, 0])
        .map(sum => sum / coordinates.length);
        
      // Calcular zoom y bounds para la imagen estática
      let zoom = 5;
      if (coordinates.length > 1) {
        // Lógica para determinar zoom basado en la distancia entre puntos
        // Simplificación: usar un zoom fijo para el MVP
      }
      
      // Crear línea de ruta para mostrar en la imagen estática
      const path = encodeURIComponent(coordinates.map(coord => coord.join(',')).join(';'));
      // Asegúrate de que el color esté en formato correcto para la URL (sin #)
      const color = this.state.lineColor.replace('#', '');

      // Construir URL de la imagen estática correctamente
      const width = 800;
      const height = 400;
      const styleId = this.state.mapStyle.split('/').pop();
      const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/path-5+${color}-1(${path})/${center.join(',')},${zoom}/${width}x${height}@2x?access_token=${this.mapHandler.mapboxToken}`;
      
      // Crear estructura de la estampita con la imagen estática
      tempDiv.innerHTML = `
        <img src="${staticMapUrl}" alt="Mapa de ruta" style="width:100%; height:auto;">
        <div class="p-4 bg-white">
          <h3 class="text-xl font-bold text-center">${this.state.title}</h3>
          <p class="text-gray-600 text-center">${this.mapHandler.getDestinationsString()}</p>
        </div>
        <div class="absolute bottom-2 right-2 text-xs text-gray-500 opacity-80">
          ${isPremium ? '' : 'TravelPrint.me - Versión gratuita'}
        </div>
      `;
      
      // Agregar temporalmente al DOM para poder capturarlo
      document.body.appendChild(tempDiv);
      
      // Capturar como imagen
      const canvas = await html2canvas(tempDiv, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      // Eliminar del DOM
      document.body.removeChild(tempDiv);
      
      // Descargar imagen
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
          this.state.destinations = parsed.destinations;
        }
      } catch (error) {
        console.error('Error al cargar datos guardados:', error);
      }
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado, inicializando aplicación');
  const app = new TravelPrintApp();
  app.init();
});