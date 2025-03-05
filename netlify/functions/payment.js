exports.handler = async function(event, context) {
    // Verificar método
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Método no permitido' })
      };
    }
  
    try {
      const body = JSON.parse(event.body);
      const { orderId } = body;
  
      // En un escenario real, aquí harías una petición a la API de LemonSqueezy
      // para verificar el estado del pago usando el orderId
      
      // Para el MVP, simplemente simulamos una verificación exitosa
      const success = true;
  
      return {
        statusCode: 200,
        body: JSON.stringify({
          success,
          orderId,
          message: success ? 'Pago verificado correctamente' : 'Pago no encontrado o incompleto'
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error del servidor', error: error.toString() })
      };
    }
  };