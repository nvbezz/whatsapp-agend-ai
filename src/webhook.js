const { Router } = require('express');

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
  console.log('[WEBHOOK] Mensaje recibido de Meta:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

module.exports = router;
