class PaymentHandler {
  constructor() {
    this.productId = '462437'; // Tu ID de producto LemonSqueezy
    this.lemonSqueezyScriptUrl = 'https://app.lemonsqueezy.com/js/lemon.js';
    this.scriptLoaded = false;
  }

  async loadLemonSqueezyScript() {
    if (this.scriptLoaded) return true;
    
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = this.lemonSqueezyScriptUrl;
      script.async = true;
      
      script.onload = () => {
        this.scriptLoaded = true;
        // Inicializar LemonSqueezy después de cargar el script
        window.createLemonSqueezy();
        resolve(true);
      };
      
      script.onerror = () => {
        console.error('Error al cargar el script de LemonSqueezy');
        resolve(false);
      };
      
      document.body.appendChild(script);
    });
  }

  async initiatePayment(customData = {}) {
    try {
      // Cargar el script si aún no está cargado
      const scriptLoaded = await this.loadLemonSqueezyScript();
      
      if (!scriptLoaded) {
        console.error('No se pudo cargar el script de LemonSqueezy');
        return false;
      }

      // Configurar los datos para el checkout
      const checkoutOptions = {
        checkout: {
          product: this.productId,
          // Datos personalizados para tu uso
          custom: customData
        }
      };
      
      // Abrir el checkout overlay
      window.LemonSqueezy.Checkout.open(checkoutOptions);
      
      return true;
    } catch (error) {
      console.error('Error al iniciar el pago:', error);
      return false;
    }
  }

  // Esta función verificaría el estado del pago mediante una función serverless
  async verifyPayment(orderId) {
    try {
      const response = await fetch('/.netlify/functions/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error al verificar el pago:', error);
      return false;
    }
  }
}