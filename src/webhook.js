const crypto = require('crypto');
const { Router } = require('express');
const { handleMessage } = require('./agent');
const { isDuplicateMessage, checkRateLimit } = require('./db');
const { sendMessage } = require('./whatsapp');

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

router.post('/', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  if (signature && process.env.META_APP_SECRET) {
    if (!req.rawBody) {
      console.warn('[WEBHOOK] No hay rawBody para validar firma HMAC');
      return res.sendStatus(400);
    }
    const expected = 'sha256=' + crypto
      .createHmac('sha256', process.env.META_APP_SECRET)
      .update(req.rawBody)
      .digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.warn('[WEBHOOK] Firma HMAC inválida');
      return res.sendStatus(403);
    }
  }

  res.sendStatus(200);

  try {
    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return;

    const phoneNumber = message.from;

    if (message.type !== 'text') {
      console.log(`[WEBHOOK] Mensaje no-texto (${message.type}) de ${phoneNumber}`);
      await sendMessage(phoneNumber, 'Solo entiendo mensajes de texto. Por favor escríbeme lo que necesitas.');
      return;
    }

    if (await isDuplicateMessage(message.id)) {
      console.warn(`[WEBHOOK] Mensaje duplicado ignorado: ${message.id}`);
      return;
    }

    if (!(await checkRateLimit(phoneNumber))) {
      console.warn(`[WEBHOOK] Rate limit superado para ${phoneNumber}`);
      await sendMessage(phoneNumber, 'Estás escribiendo muy rápido, espera un momento antes de continuar.');
      return;
    }

    const userMessage = message.text.body;
    console.log(`[WEBHOOK] Mensaje de ${phoneNumber}: "${userMessage}"`);
    handleMessage(phoneNumber, userMessage).catch((err) => {
      console.error('[WEBHOOK] handleMessage falló:', err.message);
    });
  } catch (err) {
    console.error('[WEBHOOK] Error extrayendo mensaje:', err.message);
  }
});

module.exports = router;
