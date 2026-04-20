require('dotenv').config();

const express = require('express');
require('./src/db');
const webhookRouter = require('./src/webhook');

const app = express();
app.use(express.json());

app.use('/webhook', webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] Servidor corriendo en puerto ${PORT}`);
});
