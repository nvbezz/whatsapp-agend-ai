const { Router } = require('express');
const { handleMessage } = require('./agent');

const router = Router();

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[WEBHOOK] Verificación de Meta exitosa');
    return res.status(200).send(challenge);
  }

  console.warn('[WEBHOOK] Verificación fallida: token incorrecto o mode inválido');
  res.sendStatus(403);
});

router.post('/', (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || message.type !== 'text') return;

    const phoneNumber = message.from;
    const userMessage = message.text.body;

    console.log(`[WEBHOOK] Mensaje de ${phoneNumber}: "${userMessage}"`);
    handleMessage(phoneNumber, userMessage);
  } catch (err) {
    console.error('[WEBHOOK] Error extrayendo mensaje:', err.message);
  }
});

module.exports = router;
