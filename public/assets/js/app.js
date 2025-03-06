class TravelPrintApp {
  constructor() {
    // Definir plantillas disponibles
    this.templates = {
      classic: {
        name: 'Clásico',
        ratio: 4/3,
        width: 800,
        height: 600,
        mapHeight: '70%',
        titlePosition: 'bottom',
        borderStyle: 'border-8 border-indigo-100 rounded-lg',
        fontClass: 'font-serif'
      },
      square: {
        name: 'Cuadrado',
        ratio: 1/1,
        width: 800,
        height: 800,
        mapHeight: '80%',
        titlePosition: 'bottom',
        borderStyle: 'border-8 border-indigo-100 rounded-lg',
        fontClass: 'font-sans'
      },
      vertical: {
        name: 'Vertical',
        ratio: 4/5,
        width: 600,
        height: 750,
        mapHeight: '65%',
        titlePosition: 'bottom',
        borderStyle: 'border-8 border-indigo-100 rounded-lg',
        fontClass: 'font-sans'
      },
      story: {
        name: 'Historia',
        ratio: 9/16,
        width: 540,
        height: 960,
        mapHeight: '60%',
        titlePosition: 'bottom',
        borderStyle: 'border-8 border-indigo-100 rounded-lg',
        fontClass: 'font-sans'
      },
      wide: {
        name: 'Panorámico',
        ratio: 16/9,
        width: 960,
        height: 540,
        mapHeight: '75%',
        titlePosition: 'bottom',
        borderStyle: 'border-8 border-indigo-100 rounded-lg',
        fontClass: 'font-sans'
      }
    };

    // Inicializar estado de la aplicación
    this.state = {
      title: 'Mi viaje por Chile',
      lineColor: '#4F46E5',
      mapStyle: 'mapbox://styles/mapbox/streets-v12',
      templateStyle: 'classic'
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

    // Listener para cambio de plantilla
    document.getElementById('templateStyle').addEventListener('change', (e) => {
      this.updateTemplateStyle(e.target.value);
    });

    // Listeners para botones de descarga
    document.getElementById('downloadFreeBtn').addEventListener('click', () => {
      this.downloadStamp(false);
    });

    document.getElementById('downloadPremiumBtn').addEventListener('click', () => {
      this.downloadPremiumStamp();
    });

    // Añadir listener para redimensionamiento de ventana
    window.addEventListener('resize', () => {
      if (this.mapHandler && this.mapHandler.map) {
        // Forzar actualización del mapa
        setTimeout(() => {
          this.updatePreviewStyle();
        }, 100);
      }
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

  updateTemplateStyle(templateStyle) {
    this.state.templateStyle = templateStyle;
    this.updatePreviewStyle();
    this.saveState();
  }

  updatePreviewStyle() {
    const preview = document.getElementById('stampPreview');
    const template = this.templates[this.state.templateStyle];
    
    // Actualizar tamaño y estilo del contenedor de previsualización
    preview.className = `relative ${template.borderStyle} overflow-hidden`;
    
    // Ajustar la altura del mapa en proporción - usar pixeles para mayor consistencia
    const mapDiv = document.getElementById('map');
    const previewWidth = preview.clientWidth;
    const mapHeight = previewWidth * (template.height / template.width) * parseFloat(template.mapHeight) / 100;
    mapDiv.style.height = `${mapHeight}px`;
    
    // Ajustar estilos de fuente
    const title = document.getElementById('previewTitle');
    title.className = `text-xl font-bold text-center ${template.fontClass}`;
    
    // Forzar actualización del mapa si es necesario
    setTimeout(() => {
      if (this.mapHandler.map) {
        this.mapHandler.map.resize();
      }
    }, 100);
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
    document.getElementById('templateStyle').value = this.state.templateStyle;
    
    // Actualizar previsualización
    document.getElementById('previewTitle').textContent = this.state.title;
    this.updateDestinationsList();
    this.updatePreviewDestinations();
    this.updatePreviewStyle();
  }

  // Asegurar que el mapa se renderiza completamente
  async ensureMapIsRendered() {
    // Asegurarse de que el mapa existe
    if (!this.mapHandler.map) {
      console.error('El mapa no está inicializado');
      return;
    }
    
    // Forzar un redimensionamiento para asegurar que el mapa se renderice completamente
    this.mapHandler.map.resize();
    
    // Si las rutas no son visibles, intentar mejorar su visibilidad
    try {
      // Asegurarse de que las rutas son visibles
      const lineColor = this.state.lineColor;
      if (this.mapHandler.map.getLayer('route')) {
        this.mapHandler.map.setPaintProperty('route', 'line-width', 5);
        this.mapHandler.map.setPaintProperty('route', 'line-color', lineColor);
      }
      
      // Ajustar el mapa para mostrar todos los puntos
      if (this.mapHandler.destinations.length > 1) {
        const coordinates = this.mapHandler.destinations.map(dest => dest.coordinates);
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        
        this.mapHandler.map.fitBounds(bounds, {
          padding: 50,
          duration: 300
        });
      }
    } catch (e) {
      console.warn('Error al intentar ajustar la visualización del mapa:', e);
    }
    
    // Esperar a que el mapa termine de renderizar
    await new Promise(resolve => {
      if (this.mapHandler.map.loaded()) {
        setTimeout(resolve, 500); // Pequeña espera adicional
      } else {
        this.mapHandler.map.once('idle', () => {
          setTimeout(resolve, 500);
        });
      }
    });
  }

  async downloadStamp(isPremium = false) {
    // Verificar si hay destinos
    if (this.mapHandler.destinations.length < 2) {
      alert('Añade al menos 2 destinos para crear tu estampita');
      return;
    }
  
    try {
      // Obtener configuración de la plantilla seleccionada
      const template = this.templates[this.state.templateStyle];
      
      // Asegurarse de que el mapa esté correctamente renderizado antes de capturarlo
      await this.ensureMapIsRendered();
      
      // Altura del mapa y del contenido de texto
      const mapHeight = Math.round(template.height * parseFloat(template.mapHeight) / 100);
      const textHeight = template.height - mapHeight;
      
      // 1. Primero capturamos el mapa interactivo existente
      console.log('Capturando el mapa interactivo...');
      const mapElement = document.getElementById('map');
      
      // Crear elemento de canvas para la captura
      const mapCanvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: true
      });
      
      // Crear una URL de datos para la imagen del mapa
      const mapImageUrl = mapCanvas.toDataURL('image/png');
      console.log('Mapa capturado exitosamente');
      
      // 2. Crear un div temporal para la estampita completa
      const tempDiv = document.createElement('div');
      tempDiv.className = `relative ${template.borderStyle} overflow-hidden`;
      tempDiv.style.width = `${template.width}px`;
      tempDiv.style.height = `${template.height}px`;
      
      // Crear estructura de la estampita con la imagen del mapa
      tempDiv.innerHTML = `
        <img src="${mapImageUrl}" alt="Mapa de ruta" 
             style="width:100%; height:${mapHeight}px; object-fit:cover;">
        <div class="p-4 bg-white" style="height:${textHeight}px;">
          <h3 class="text-xl font-bold text-center ${template.fontClass}">${this.state.title}</h3>
          <p class="text-gray-600 text-center ${template.fontClass}">${this.mapHandler.destinations.map(d => d.name).join(' → ')}</p>
        </div>
        <div class="absolute bottom-2 right-2 text-xs text-gray-500 opacity-${isPremium ? '0' : '80'}">
          ${isPremium ? '' : 'TravelPrint.me - Versión gratuita'}
        </div>
      `;
      
      // Agregar temporalmente al DOM para poder capturarlo
      document.body.appendChild(tempDiv);
      
      // 3. Esperar un momento para asegurar que todo se renderice
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 4. Capturar la estampita completa
      console.log('Generando imagen final...');
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
      console.log('Estampita generada y descargada correctamente');
    } catch (error) {
      console.error('Error al descargar la estampita:', error);
      alert('Hubo un error al generar la imagen. Inténtalo de nuevo.');
    }
  }

  async downloadPremiumStamp() {
    try {
      // Verificar si hay destinos
      if (this.mapHandler.destinations.length < 2) {
        alert('Añade al menos 2 destinos para crear tu estampita');
        return;
      }
  
      // Preparar datos para el pago
      const customData = {
        title: this.state.title,
        destinations: this.mapHandler.destinations.map(d => d.name).join(','),
        templateStyle: this.state.templateStyle
      };
      
      // Configurar eventos de LemonSqueezy antes de iniciar el checkout
      if (typeof window.LemonSqueezy !== 'undefined') {
        window.LemonSqueezy.Setup({
          events: {
            'Checkout.Success': (data) => {
              console.log('Pago exitoso:', data);
              // Descargar la versión premium
              this.downloadStamp(true);
            }
          }
        });
      }
      
      // Iniciar proceso de pago con overlay
      const paymentInitiated = await this.paymentHandler.initiatePayment(customData);
      
      if (!paymentInitiated) {
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
      templateStyle: this.state.templateStyle,
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
        this.state.templateStyle = parsed.templateStyle || this.state.templateStyle;
        
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