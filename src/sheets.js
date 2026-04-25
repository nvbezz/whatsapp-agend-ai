const { google } = require('googleapis');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-credentials.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Citas';

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

async function appendAppointment({ name, phoneNumber, service, date, time }) {
  try {
    const sheets = await getSheetsClient();
    const now = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:F`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[name, phoneNumber, service, date, time, now]],
      },
    });

    console.log(`[SHEETS] Cita agregada: ${name} - ${service} - ${date} ${time}`);
  } catch (err) {
    console.error('[SHEETS] Error al escribir en Sheets:', err.message);
    throw err;
  }
}

module.exports = { appendAppointment };
