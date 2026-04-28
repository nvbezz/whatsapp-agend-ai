require('dotenv').config();

const express = require('express');
const { pool, initDB, cleanupRateLimits } = require('./src/db');
const webhookRouter = require('./src/webhook');

const app = express();

app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));

app.use('/webhook', webhookRouter);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT || 3000;

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[SERVER] Servidor corriendo en puerto ${PORT}`);
    });
    setInterval(() => {
      cleanupRateLimits().catch((err) => {
        console.error('[SERVER] Error en cleanup:', err.message);
      });
    }, 60 * 60 * 1000);
  })
  .catch((err) => {
    console.error('[SERVER] Error inicializando DB:', err.message);
    process.exit(1);
  });
