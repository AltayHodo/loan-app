/* eslint-disable @typescript-eslint/triple-slash-reference */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/// <reference path="../types/ambient.d.ts" />

const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const Papa = require('papaparse');
const XLSX = require('xlsx');

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const config = {
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 3000,
    debug: false,
  },
};

async function fetchEmails() {
  const connection = await imaps.connect(config);
  await connection.openBox('INBOX');

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const since = threeDaysAgo.toISOString().slice(0, 10).replace(/-/g, '-');
  const searchCriteria = ['UNSEEN', ['SINCE', since]];

  const fetchOptions = {
    bodies: [''],
    markSeen: false,
  };

  let messages = [];

  try {
    messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${messages.length} new unread message(s)`);
  } catch (err) {
    if (err instanceof Error) {
      console.log('Error during search:', err.message);
    } else {
      console.log('Unknown error during search:', err);
    }
    await connection.end();
    return;
  }

  if (!messages.length) {
    console.log('No new messages today.');
    await connection.end();
    return;
  }

  const parsedEmails = [];

  for (const m of messages) {
    const raw = m.parts.find((p: any) => p.which === '')?.body;
    if (!raw) continue;

    const parsed = await simpleParser(raw);

    if (parsed.attachments?.length > 0) {
      for (const attachment of parsed.attachments) {
        const { filename, content } = attachment;
        let rows: any[] = [];

        if (filename.endsWith('.csv')) {
          const parsedCsv = Papa.parse(content.toString(), {
            header: true,
            skipEmptyLines: true,
          });
          rows = parsedCsv.data;
        } else if (filename.endsWith('.xlsx')) {
          const workbook = XLSX.read(content, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(worksheet);
        } else {
          continue;
        }

        for (const row of rows) {
          const loan = extractLoanFromRow(row);
          if (loan) {
            const { error } = await supabase.from('loans').insert({
              ...loan,
            });

            if (error) {
              console.log('Supabase insert error:', error.message);
            } else {
              console.log(`Inserted loan ${loan.loan_id}`);
            }
          }
        }
      }
    }
  }

  await connection.end();
  console.log('IMAP connection closed.');
}

function extractLoanFromRow(row: any) {
  const loan_id = row['Loan ID'];
  const borrower_name = row['Borrower'];
  const requested_amount = parseFloat(row['Requested']);
  const funded_amount = parseFloat(row['Funded']);
  const date = row['Date'];

  if (
    !loan_id ||
    !borrower_name ||
    isNaN(requested_amount) ||
    isNaN(funded_amount) ||
    !date
  ) {
    return null;
  }

  return {
    loan_id,
    borrower_name,
    requested_amount,
    funded_amount,
    date,
  };
}

fetchEmails().catch((err: any) => {
  if (err instanceof Error) {
    console.error('Error during script execution:', err.message);
  } else {
    console.error('Unknown error during script execution:', err);
  }
});
