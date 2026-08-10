# Digital Khata (Credit Ledger)

Digital Khata is a fast, offline-first web application designed to help business owners and individuals track credits, loans, and payments for their customers. It supports bilingual display in Kannada and English.

## Key Features

- **Credit & Payment Tracking:** Easily record credit extended to customers and payments received from them.
- **WhatsApp Reminders:** Send detailed balance summaries and payment reminders directly to customers via WhatsApp.
- **Printable Statements (PDF):** Generate and print official transaction histories or save them as PDFs.
- **PIN Lock Protection:** Keep ledger details secure with a customizable access PIN.
- **100% Offline-First:** Stores all data locally in the browser so it works even without an internet connection.

## Technology Stack

- **Frontend:** Next.js (React 19 & TypeScript)
- **Styling:** Tailwind CSS (v4)
- **Database:** IndexedDB (via Dexie.js) for high-performance client-side storage
- **Icons:** Lucide React

## Getting Started

Follow these steps to run the application locally on your machine:

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser to view the application.

### 3. Build for Production
To create an optimized production build:
```bash
npm run build
npm run start
```

## Data Privacy & Storage

All database logs, transaction history, customer details, and your access PIN are stored **entirely within your browser's local sandbox** (IndexedDB and LocalStorage). 

- No data is uploaded or synced to external servers.
- Clear browser data/cookies with caution, as doing so will clear the local ledger data.
