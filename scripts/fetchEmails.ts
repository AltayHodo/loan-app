/* eslint-disable @typescript-eslint/triple-slash-reference */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/// <reference path="../types/ambient.d.ts" />

const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

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
  console.log('Connecting to IMAP...');
  const connection = await imaps.connect(config);
  console.log('Connected and logged in.');

  await connection.openBox('INBOX');
  console.log('INBOX opened');

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
    console.log('Searching for recent unread messages...');
    messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${messages.length} new unread message(s)`);
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error during search:', err.message);
    } else {
      console.error('Unknown error during search:', err);
    }
    await connection.end();
    return;
  }

  if (!messages.length) {
    console.log('No new messages today.');
    await connection.end();
    return;
  }

  for (const m of messages) {
    const raw = m.parts.find((p: any) => p.which === '')?.body;
    if (!raw) continue;

    const parsed = await simpleParser(raw);
    const messageId = parsed.messageId;

    if (!messageId) {
      console.log('Email skipped: missing messageId.');
      continue;
    }

    const { data: existing, error: checkError } = await supabase
      .from('loans')
      .select('id')
      .eq('message_id', messageId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`Skipped duplicate email with messageId: ${messageId}`);
      continue;
    }

    const text = parsed.text?.trim();
    // console.log('Parsed email text:', text);

    const loan = extractLoanFromText(text || '');
    if (loan) {
      const { error } = await supabase.from('loans').insert({
        ...loan,
        message_id: messageId,
      });

      if (error) {
        console.error('Supabase insert error:', error.message);
      } else {
        console.log(`Inserted loan ${loan.loan_id}`);
      }
    } else {
      // console.log('No valid loan data found in email.');
    }
  }

  await connection.end();
  console.log('IMAP connection closed.');
}

function extractLoanFromText(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const get = (label: string) =>
    lines
      .find((line) => line.toLowerCase().startsWith(label.toLowerCase()))
      ?.split(':')
      .slice(1)
      .join(':')
      .trim();

  const loan_id = get('Loan ID');
  const borrower_name = get('Borrower');
  const requested_amount = parseFloat(get('Requested') || '');
  const funded_amount = parseFloat(get('Funded') || '');
  const date = get('Date');

  console.log('Parsed loan_id:', loan_id);
  console.log(
    'Requested:',
    requested_amount,
    'Funded:',
    funded_amount,
    'Date:',
    date
  );

  if (!loan_id || isNaN(requested_amount) || isNaN(funded_amount) || !date)
    return null;

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
