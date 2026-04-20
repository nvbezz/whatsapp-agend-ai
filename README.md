# 🤖 WhatsApp Agend AI

Agente inteligente de WhatsApp desarrollado con **Node.js** y **Gemini 2.5 Flash** para la gestión automatizada de citas médicas y comerciales.

## 🚀 Características
- **IA Generativa:** Procesamiento de lenguaje natural con Gemini para entender solicitudes de agendamiento.
- **Persistencia:** Base de datos ligera con SQLite para almacenar conversaciones y citas.
- **Canal Oficial:** Integración con WhatsApp Cloud API (Meta).
- **Seguridad:** Configuración profesional mediante variables de entorno.

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