const { sheets, auth } = require('@googleapis/sheets');
const path = require('path');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Citas';

async function getSheetsClient() {
  let credentials;

  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  } else {
    const credentialsPath = path.join(__dirname, '..', 'google-credentials.json');
    credentials = require(credentialsPath);
  }

  const authClient = new auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return sheets({ version: 'v4', auth: authClient });
}

async function appendAppointment({ name, phoneNumber, service, date, time }) {
  try {
    const client = await getSheetsClient();
    const now = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });

    await client.spreadsheets.values.append({
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
