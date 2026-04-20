const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const SYSTEM_PROMPT = `Eres el asistente virtual de una barbería en Santiago, Chile.
Tu rol es ayudar a los clientes a agendar citas de forma amigable y eficiente.
Servicios disponibles: Corte de cabello, Perfilado de barba, Combo (corte + barba).
Habla en español chileno, con un tono cercano pero profesional.
Para confirmar una cita necesitas recopilar: nombre del cliente, servicio, fecha y hora.
Cuando tengas todos los datos, confírmalos antes de cerrar la reserva.`;

async function getAIResponse(history, userMessage) {
  try {
    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();
    console.log(`[AI] Respuesta generada (${response.length} chars)`);
    return response;
  } catch (err) {
    console.error('[AI] Error al llamar a Gemini:', err.message);
    throw err;
  }
}

module.exports = { getAIResponse };
