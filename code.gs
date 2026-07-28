/**
 * Expense Tracker — Google Apps Script backend
 * Stores data in the 'Expenses' sheet of the spreadsheet this script is bound to.
 *
 * DEPLOY: Deploy > New deployment > Web app
 *   - Execute as:      Me
 *   - Who has access:  Anyone
 *   Copy the /exec URL and paste it into the app's Settings screen.
 *
 * PRIVACY: because each person deploys their OWN copy of this script against
 * their OWN spreadsheet, their data never touches anyone else's backend.
 * For a little extra protection, set APP_SECRET below and enter the same value
 * in the app's Settings. Leave it '' to disable the check.
 */

const APP_SECRET = ''; // e.g. 'my-private-key-9182'. Must match the app's Settings.
const SHEET_NAME = 'Expenses';

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID','Name','Date','Category','PaidBy','TotalAmount','OwedByMe','OwedByOthers','Comments']);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function authorized_(token) {
  return !APP_SECRET || token === APP_SECRET;
}

// READ — returns the full list as clean, camelCase JSON.
function doGet(e) {
  try {
    if (!authorized_(e && e.parameter && e.parameter.token)) {
      return json_({ success: false, error: 'unauthorized' });
    }
    const sheet = getSheet_();
    const rows = sheet.getDataRange().getValues();
    const tz = Session.getScriptTimeZone();
    const out = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1]) continue; // skip blank rows (no name)
      let dateVal = r[2];
      if (dateVal instanceof Date) {
        dateVal = Utilities.formatDate(dateVal, tz, 'yyyy-MM-dd'); // avoids UTC off-by-one
      }
      out.push({
        id: r[0],
        name: r[1],
        date: dateVal,
        category: r[3],
        paidBy: r[4],
        totalAmount: Number(r[5]) || 0,
        owedByMe: Number(r[6]) || 0,
        owedByOthers: Number(r[7]) || 0,
        comments: r[8]
      });
    }
    return json_(out);
  } catch (err) {
    return json_({ success: false, error: err.toString() });
  }
}

// WRITE — add or delete. Called via fetch with a text/plain body (no CORS preflight).
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (!authorized_(body.token)) {
      return json_({ success: false, error: 'unauthorized' });
    }
    const sheet = getSheet_();

    if (body.action === 'delete') {
      const values = sheet.getDataRange().getValues();
      for (let i = values.length - 1; i >= 1; i--) {
        if (values[i][0] === body.id) { sheet.deleteRow(i + 1); break; }
      }
      return json_({ success: true, id: body.id, deleted: true });
    }

    // default: add
    const id = body.id || Utilities.getUuid();

    // Idempotency: if this id already exists, don't create a duplicate.
    // (Protects against retries after a flaky network.)
    const existing = sheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][0] === id) return json_({ success: true, id: id, duplicate: true });
    }

    sheet.appendRow([
      id,
      body.name,
      body.date,
      body.category,
      body.paidBy,
      Number(body.totalAmount) || 0,
      Number(body.owedByMe) || 0,
      Number(body.owedByOthers) || 0,
      body.comments || ''
    ]);
    return json_({ success: true, id: id });
  } catch (err) {
    return json_({ success: false, error: err.toString() });
  }
}
