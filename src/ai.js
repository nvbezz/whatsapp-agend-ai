const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_NAME = 'gemini-2.5-flash-lite';

const SYSTEM_PROMPT = `Eres el asistente virtual de una barbería ubicada en Santiago, Chile.
Tu rol es ayudar a los clientes a agendar citas de forma amigable y eficiente.

Servicios disponibles:
- Corte de cabello ($8.000)
- Perfilado de barba ($5.000)
- Combo corte + barba ($11.000)

Horario de atención: lunes a sábado de 10:00 a 20:00. Cada cita dura 30 minutos.

Estilo de comunicación:
- Habla en español neutro y natural, sin modismos chilenos (no uses "estai", "po", "weón", etc.).
- Tono cálido, cercano y profesional, como una recepcionista amable.
- Usa emojis con moderación para hacer la conversación más cálida (✂️ 💈 📅 ⏰ ✅ 👋), uno o dos por mensaje, sin saturar.
- Mensajes breves y claros, sin párrafos largos.

Para confirmar una cita necesitas recopilar: nombre del cliente, servicio, fecha y hora.
Cuando tengas los 4 datos y el cliente confirme, llama a la función confirm_appointment con esos datos.
Si el horario está ocupado, infórmalo y ofrece alternativas cercanas.`;

const tools = [
  {
    functionDeclarations: [
      {
        name: 'confirm_appointment',
        description: 'Confirma y guarda una cita cuando el cliente ya proporcionó nombre, servicio, fecha y hora y aceptó la reserva.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'Nombre completo del cliente' },
            service: { type: 'STRING', description: 'Servicio solicitado' },
            date: { type: 'STRING', description: 'Fecha en formato DD/MM/YYYY' },
            time: { type: 'STRING', description: 'Hora en formato HH:MM' },
          },
          required: ['name', 'service', 'date', 'time'],
        },
      },
    ],
  },
];

const model = genAI.getGenerativeModel({ model: MODEL_NAME, tools });

async function getAIResponse(history, userMessage) {
  try {
    const now = new Date().toLocaleDateString('es-CL', {
      timeZone: 'America/Santiago',
      weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const systemWithDate = `${SYSTEM_PROMPT}\n\nFecha y día actual: ${now}. Usa esto para resolver referencias relativas como "mañana", "el viernes", etc. Nunca confirmes una fecha pasada.`;

    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
      systemInstruction: { parts: [{ text: systemWithDate }] },
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;

    const functionCall = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.functionCall
    )?.functionCall;

    if (functionCall && functionCall.name === 'confirm_appointment') {
      console.log('[AI] Function call detectada: confirm_appointment', functionCall.args);
      return { type: 'appointment', data: functionCall.args };
    }

    const text = response.text();
    console.log(`[AI] Respuesta generada (${text.length} chars)`);
    return { type: 'text', data: text };
  } catch (err) {
    console.error('[AI] Error al llamar a Gemini:', err.message);
    throw err;
  }
}

module.exports = { getAIResponse };
