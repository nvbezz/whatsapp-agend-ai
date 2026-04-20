const { getOrCreateConversation, updateHistory } = require('./db');
const { getAIResponse } = require('./ai');
const { sendMessage } = require('./whatsapp');

async function handleMessage(phoneNumber, userMessage) {
  console.log(`[AGENT] Procesando mensaje de ${phoneNumber}: "${userMessage}"`);

  try {
    const conversation = getOrCreateConversation(phoneNumber);
    const history = JSON.parse(conversation.history);

    const aiResponse = await getAIResponse(history, userMessage);

    const updatedHistory = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'model', content: aiResponse },
    ];
    updateHistory(phoneNumber, updatedHistory);

    await sendMessage(phoneNumber, aiResponse);
    console.log(`[AGENT] Flujo completado para ${phoneNumber}`);
  } catch (err) {
    console.error(`[AGENT] Error procesando mensaje de ${phoneNumber}:`, err.message);
  }
}

module.exports = { handleMessage };
