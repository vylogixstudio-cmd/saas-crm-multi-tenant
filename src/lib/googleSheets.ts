import { google } from 'googleapis';
import type { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/**
 * Parses the service account JSON key from the environment variable.
 */
export function getAuthClient() {
  const keyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyString) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable.');
  }

  try {
    const credentials = JSON.parse(keyString);
    // Ensure newlines are properly formatted in case .env messed them up
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    return new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
  } catch (err) {
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY. Ensure it is a valid JSON string.');
  }
}

/**
 * Appends rows to a specific tab in a Google Sheet.
 * Useful for realtime syncs or adding notes.
 *
 * @param sheetId The Google Sheet ID
 * @param tabName The name of the tab/worksheet
 * @param rows 2D array of data to append
 */
export async function appendRows(sheetId: string, tabName: string, rows: any[][]) {
  if (!rows || rows.length === 0) return;

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const request = {
    spreadsheetId: sheetId,
    range: `${tabName}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  };

  try {
    await sheets.spreadsheets.values.append(request);
  } catch (error: any) {
    console.error(`Failed to append rows to sheet ${sheetId} (tab: ${tabName}):`, error.message);
    throw new Error(`Google Sheets API Error: ${error.message}`);
  }
}

/**
 * Clears an entire tab and rewrites it with new data.
 * Useful for nightly full-syncs.
 *
 * @param sheetId The Google Sheet ID
 * @param tabName The name of the tab/worksheet
 * @param rows 2D array of data to write
 */
export async function clearAndWrite(sheetId: string, tabName: string, rows: any[][]) {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // 1. Try to clear existing content. If tab doesn't exist, this will throw "Unable to parse range"
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: sheetId,
        range: `${tabName}!A:Z`
      });
    } catch (clearError: any) {
      if (clearError.message && clearError.message.includes('Unable to parse range')) {
        // Tab doesn't exist, let's create it!
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: { title: tabName }
              }
            }]
          }
        });
      } else {
        throw clearError;
      }
    }

    // 2. Write new rows (if any)
    if (rows && rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${tabName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: rows },
      });
    }
  } catch (error: any) {
    console.error(`Failed to clear and write to sheet ${sheetId} (tab: ${tabName}):`, error.message);
    throw new Error(`Google Sheets API Error: ${error.message}`);
  }
}

/**
 * Validates if the service account has access to the given spreadsheet.
 * 
 * @param sheetId The Google Sheet ID
 * @returns Object containing success boolean and optional error message
 */
export async function validateSheetAccess(sheetId: string): Promise<{ success: boolean; error?: string }> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      includeGridData: false, 
    });
    return { success: true };
  } catch (error: any) {
    console.error(`Validation failed for sheet ${sheetId}:`, error.message);
    return { success: false, error: error.message };
  }
}
