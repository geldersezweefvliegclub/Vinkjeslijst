# nest-gsheet-email

A tiny NestJS service with one endpoint that:
- looks up a Google Spreadsheet by **name** (via Drive API),
- reads **column B** for the provided **row** (from the first or a specified tab),
- POSTs the email to `https://helios.gezc.org/setEmail` with retries.

## Requirements

- Google Cloud project with **Drive API** and **Sheets API** enabled.
- A **Service Account** with access to the target spreadsheet.
- The spreadsheet must be **shared** with the service account email (Viewer is sufficient).

## Install

```bash
npm install
```

## Configure

Copy `.env.example` to `.env` and set one of:

- `GOOGLE_CREDENTIALS` (inline JSON) **or**
- `GOOGLE_APPLICATION_CREDENTIALS` (path to JSON file)

Optional: set `PORT` (default 3000).

## Run (dev)

```bash
npm run start:dev
```

## Build & Run (prod)

```bash
npm run build
npm start
```

## Endpoint

**POST** `/process`

Body:
```json
{
  "sheetName": "My Contacts",
  "row": 7,
  "tabName": "Sheet1"   // optional; defaults to the first tab
}
```

Response:
```json
{
  "ok": true,
  "spreadsheetId": "1AbC...",
  "tab": "Sheet1",
  "row": 7,
  "email": "user@example.com",
  "helios": { "status": 200, "data": { /* upstream data */ } }
}
```

Errors are returned with `{ ok: false, error: "..." }`.