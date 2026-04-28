const { getOrCreateConversation, updateHistory, createAppointment, isSlotTaken } = require('./db');
const { getAIResponse } = require('./ai');
const { sendMessage } = require('./whatsapp');
const { appendAppointment } = require('./sheets');

function validateAppointmentSlot(date, time) {
  const [day, month, year] = date.split('/').map(Number);
  if (!day || !month || !year) throw new Error('Formato de fecha inválido');

  const appointmentDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointmentDate < today) throw new Error('Fecha pasada');

  if (appointmentDate.getDay() === 0) throw new Error('Domingo no disponible');

  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  if (totalMinutes < 10 * 60 || totalMinutes > 19 * 60 + 30) {
    throw new Error('Horario fuera del rango de atención (10:00 a 19:30)');
  }
}

async function handleMessage(phoneNumber, userMessage) {
  console.log(`[AGENT] Procesando mensaje de ${phoneNumber}: "${userMessage}"`);

  try {
    const conversation = await getOrCreateConversation(phoneNumber);
    const history = JSON.parse(conversation.history);

    const aiResult = await getAIResponse(history, userMessage);

    let botReply;
    let appointmentConfirmed = false;

    if (aiResult.type === 'appointment') {
      const { name, service, date, time } = aiResult.data;

      try {
        validateAppointmentSlot(date, time);

        if (await isSlotTaken(date, time)) {
          botReply = `Lo siento ${name}, el horario ${time} del ${date} ya está reservado. ¿Te acomoda otro horario ese mismo día?`;
          console.log(`[AGENT] Horario ocupado: ${date} ${time}`);
        } else {
          const appointmentId = await createAppointment({ phoneNumber, name, date, time, service });
          await appendAppointment({ name, phoneNumber, service, date, time });
          botReply = `¡Listo ${name}! Tu cita quedó confirmada.\n\n📋 *Resumen:*\n• Servicio: ${service}\n• Fecha: ${date}\n• Hora: ${time}\n\nTe esperamos en la barbería. ¡Cualquier consulta por acá!`;
          appointmentConfirmed = true;
          console.log(`[AGENT] Cita guardada: id=${appointmentId}, ${name} - ${service} - ${date} ${time}`);
        }
      } catch (appointmentErr) {
        if (appointmentErr.name === 'SlotTakenError') {
          botReply = `Lo siento ${name}, ese horario acaba de ser reservado. ¿Te acomoda otro?`;
          console.warn(`[AGENT] Race condition en slot: ${date} ${time}`);
        } else {
          console.error('[AGENT] Error al confirmar cita:', appointmentErr.message);
          botReply = `Hubo un problema al confirmar tu cita (${appointmentErr.message}). Por favor intenta con otro horario.`;
        }
      }
    } else {
      botReply = aiResult.data;
    }

    if (appointmentConfirmed) {
      await updateHistory(phoneNumber, []);
    } else {
      const updatedHistory = [
        ...history,
        { role: 'user', content: userMessage },
        { role: 'model', content: botReply },
      ];
      await updateHistory(phoneNumber, updatedHistory);
    }

    await sendMessage(phoneNumber, botReply);
    console.log(`[AGENT] Flujo completado para ${phoneNumber}`);
  } catch (err) {
    console.error(`[AGENT] Error procesando mensaje de ${phoneNumber}:`, err.message);
    try {
      await sendMessage(phoneNumber, 'Estamos teniendo problemas técnicos, vuelve a intentar en 1 minuto.');
    } catch (sendErr) {
      console.error('[AGENT] No se pudo enviar mensaje de error:', sendErr.message);
    }
  }
}

module.exports = { handleMessage };
