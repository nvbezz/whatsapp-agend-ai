const axios = require('axios');

const BASE_URL = 'https://graph.facebook.com/v19.0';

async function sendMessage(to, text) {
  const url = `${BASE_URL}/${process.env.PHONE_NUMBER_ID}/messages`;

  try {
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[WHATSAPP] Mensaje enviado a ${to}: "${text.slice(0, 60)}..."`);
  } catch (err) {
    const detail = err.response?.data ?? err.message;
    console.error(`[WHATSAPP] Error al enviar mensaje a ${to}:`, detail);
    throw err;
  }
}

module.exports = { sendMessage };
