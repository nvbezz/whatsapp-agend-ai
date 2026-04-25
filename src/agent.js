const { getOrCreateConversation, updateHistory, createAppointment, isSlotTaken } = require('./db');
const { getAIResponse } = require('./ai');
const { sendMessage } = require('./whatsapp');
const { appendAppointment } = require('./sheets');

async function handleMessage(phoneNumber, userMessage) {
  console.log(`[AGENT] Procesando mensaje de ${phoneNumber}: "${userMessage}"`);

  try {
    const conversation = getOrCreateConversation(phoneNumber);
    const history = JSON.parse(conversation.history);

    const aiResult = await getAIResponse(history, userMessage);

    let botReply;

    if (aiResult.type === 'appointment') {
      const { name, service, date, time } = aiResult.data;

      if (isSlotTaken(date, time)) {
        botReply = `Lo siento ${name}, el horario ${time} del ${date} ya está reservado. ¿Te acomoda otro horario ese mismo día?`;
        console.log(`[AGENT] Horario ocupado: ${date} ${time}`);
      } else {
        try {
          await appendAppointment({ name, phoneNumber, service, date, time });
          createAppointment({ phoneNumber, name, date, time, service });
          botReply = `¡Listo ${name}! Tu cita quedó confirmada.\n\n📋 *Resumen:*\n• Servicio: ${service}\n• Fecha: ${date}\n• Hora: ${time}\n\nTe esperamos en la barbería. ¡Cualquier consulta por acá!`;
          console.log(`[AGENT] Cita guardada y enviada a Sheets: ${name} - ${service} - ${date} ${time}`);
        } catch (sheetsErr) {
          console.error('[AGENT] Fallo al guardar cita:', sheetsErr.message);
          botReply = `Hubo un problema al confirmar tu cita. Por favor intenta nuevamente en unos minutos.`;
        }
      }
    } else {
      botReply = aiResult.data;
    }

    const updatedHistory = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'model', content: botReply },
    ];
    updateHistory(phoneNumber, updatedHistory);

    await sendMessage(phoneNumber, botReply);
    console.log(`[AGENT] Flujo completado para ${phoneNumber}`);
  } catch (err) {
    console.error(`[AGENT] Error procesando mensaje de ${phoneNumber}:`, err.message);
  }
}

module.exports = { handleMessage };
