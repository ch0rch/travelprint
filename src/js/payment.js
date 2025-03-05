class PaymentHandler {
  constructor() {
    // Para el MVP, usamos una redirección simple a LemonSqueezy
    this.checkoutUrl = 'https://travelprint.lemonsqueezy.com/checkout/buy/12345'; // Reemplazar con tu URL de producto
  }

  async initiatePayment(customData = {}) {
    try {
      // Construye una URL con parámetros de consulta para los datos personalizados
      const url = new URL(this.checkoutUrl);
      
      // Añade los datos personalizados como parámetros de consulta
      Object.keys(customData).forEach(key => {
        url.searchParams.append(key, customData[key]);
      });
      
      // Abre la URL en una nueva pestaña
      window.open(url.toString(), '_blank');
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