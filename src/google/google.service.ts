import { Injectable } from '@nestjs/common';
import { google, sheets_v4, gmail_v1 } from 'googleapis';
import { JWT } from 'google-auth-library';
import * as fs from 'node:fs';

@Injectable()
export class GoogleService {
  private credentials;

  constructor() {
    console.log("GOOGLE_PROJECT_ID:", process.env.GOOGLE_PROJECT_ID);
    console.log("GOOGLE_ADMIN_EMAIL:", process.env.GOOGLE_ADMIN_EMAIL);
    console.log("GOOGLE_CREDENTIALS_PATH:", process.env.GOOGLE_CREDENTIALS_PATH);
    console.log("GOOGLE_SHEETS_CONFIG:", process.env.GOOGLE_SHEETS_CONFIG);
    console.log("VERZENDEN_EMAIL:", process.env.VERZENDEN_EMAIL ? 'true' : 'false');

    this.credentials = fs.existsSync(process.env.GOOGLE_CREDENTIALS_PATH!)
      ? JSON.parse(
          fs.readFileSync(process.env.GOOGLE_CREDENTIALS_PATH!, {
            encoding: 'utf8',
          }),
        )
      : undefined;
  }

  private async getSheetsApi(): Promise<sheets_v4.Sheets> {
    const authClient = new JWT({
      email: this.credentials.client_email,
      key: this.credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      subject: process.env.GOOGLE_ADMIN_EMAIL, // Impersonate this user
    });
    return google.sheets({ version: 'v4', auth: authClient });
  }

  private async getGmailApi(): Promise<gmail_v1.Gmail> {
    // Create a new JWT client for Gmail with impersonation
    const authClient = new JWT({
      email: this.credentials.client_email,
      key: this.credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      subject: process.env.GOOGLE_ADMIN_EMAIL, // Impersonate this user
    });
    return google.gmail({ version: 'v1', auth: authClient });
  }

  async getFirstTabTitle(spreadsheetId: string): Promise<string> {
    const sheets = await this.getSheetsApi();
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const tabs = meta.data.sheets || [];
    if (!tabs.length) {
      throw new Error('Spreadsheet has no sheets/tabs.');
    }
    return tabs[0].properties!.title!;
  }

  async getCell(
    spreadsheetId: string,
    tabTitle: string,
    col: string,
    row: number,
  ): Promise<string> {
    const sheets = await this.getSheetsApi();
    const range = `${tabTitle}!${col}${row}:${col}${row}`;
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return data.values?.[0]?.[0]?.toString().trim() || '';
  }

  async getCells(
    spreadsheetId: string,
    tabTitle: string,
    cellen: string,
  ): Promise<string[][] | undefined> {
    const sheets = await this.getSheetsApi();
    const range = `${tabTitle}!${cellen}`;
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return data.values
      ? data.values!.map((rowFields) => rowFields.map((item) => item.trim()))
      : undefined;
  }

  async setCell(
    spreadsheetId: string,
    tabTitle: string,
    col: string,
    row: number,
    value: string,
  ): Promise<void> {
    const sheets = await this.getSheetsApi();
    const range = `${tabTitle}!${col}${row}:${col}${row}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW', // of "USER_ENTERED" als je formules wilt laten berekenen
      requestBody: {
        values: [[value]],
      },
    });
  }

  async getRows(spreadsheetId: string, tabTitle: string): Promise<number> {
    const sheets = await this.getSheetsApi();
    const res = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false,
    });

    const sheet = res.data.sheets?.find(
      (s) => s.properties?.title === tabTitle,
    );
    const totalRows = sheet?.properties?.gridProperties?.rowCount;

    return totalRows ? totalRows : 0;
  }

  base64UrlEncode(str: string) {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * To be able to send an email, the service account needs to have domain-wide delegation.
   * 1. Go to the Google Cloud Console -> IAM & Admin -> Service Accounts
   * 2. Select the service account
   * 3. Go to "Advanced settings"
   * 4. Under "Domain-wide Delegation", click "MANAGE DOMAIN-WIDE DELEGATION"
   * 5. Add the following scope: https://www.googleapis.com/auth/gmail.send
   * 6. Go to the Google Workspace Admin Console -> Security -> API Controls -> Domain-wide Delegation
   * 7. Add a new API client
   * 8. Enter the "Client ID" of the service account
   * 9. Add the following OAuth scope: https://www.googleapis.com/auth/gmail.send
   * 10. The "subject" in the JWT auth needs to be the email address of the user you want to impersonate.
   */
  async sendEmail({
    to,
    subject,
    bodyText,
  }: {
    to: string;
    subject: string;
    bodyText: string;
  }) {
    if (process.env.VERZENDEN_EMAIL === 'false') {
      console.log(`Verzenden email staat UIT, to: ${to}`);
      return;
    }
    if (this.credentials === undefined) {
      console.log('Google credentials not found, skipping email.');
      return;
    }

    const gmail = await this.getGmailApi();
    const email = [
      `From: ${process.env.GOOGLE_ADMIN_EMAIL}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=UTF-8',
      bodyText,
    ].join('\n');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: this.base64UrlEncode(email),
      },
    });
  }
}
