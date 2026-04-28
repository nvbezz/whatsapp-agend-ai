# 🤖 WhatsApp Agend AI

Agente inteligente de WhatsApp desarrollado con **Node.js** y **Gemini 2.5 Flash-Lite** para la gestión automatizada de citas médicas y comerciales.

## 🚀 Características
- **IA Generativa:** Gemini 2.5 Flash-Lite con function calling para confirmar citas estructuradas.
- **Persistencia:** PostgreSQL con índices únicos para evitar reservas duplicadas.
- **Canal Oficial:** Integración con WhatsApp Cloud API (Meta) con validación HMAC.
- **Seguridad:** Variables de entorno, rate limiting por número, validación de firma del webhook.
- **Robustez:** Health check, manejo de mensajes no-texto, cleanup automático de tablas.

## 🛠️ Requisitos previos
1. [Node.js](https://nodejs.org/) v18+ instalado.
2. Una App de tipo Business en [Meta for Developers](https://developers.facebook.com/).
3. API Key de [Google AI Studio](https://aistudio.google.com/).
4. [ngrok](https://ngrok.com/) para pruebas en entorno local.

## 📦 Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/nvbezz/whatsapp-agend-ai.git
   ```

2. Instala las dependencias:

```bash
npm install
```
3. Configura tu archivo .env basándote en el archivo .env.example.

## 🛠️ Desarrollo
Para levantar el servidor localmente:
```bash
node index.js
```
```bash
ngrok http 3000
```