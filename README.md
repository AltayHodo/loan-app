## Description
This app automates the extraction of loan data from incoming emails, stores it in Supabase, 
and visualizes the data on a React dashboard. The email script runs through a button click on the frontend.

Notes
- To see script in action, you can delete all the loans and run the script using the buttons
- Keep in mind that the script takes quite a while to run on deployment, give it some time
- Can filter the loans by date
- Currently only works on emails that have this format as their body:
  Loan ID: 127
  Borrower: Stephen Curry
  Requested: 3000
  Funded: 2500
  Date: 2025-06-09

## Deployment/Demo
Frontend (deployed on Vercel):** [https://loan-app-teal.vercel.app](https://loan-app-teal.vercel.app/)
Backend (deployed on Render):** [https://loan-app-2bi1.onrender.com/](https://loan-app-2bi1.onrender.com/)

## Supabase Schema SQL
create table if not exists loans (
  id uuid default uuid_generate_v4() primary key,
  loan_id text not null,
  borrower_name text,
  requested_amount numeric,
  funded_amount numeric,
  date date,
  message_id text unique,
  inserted_at timestamp with time zone default now()
);

## Email Script
Email script is in backend/scripts/fetchEmails.js

## Manual setup instructions
BACKEND
1. navigate to backend/
2. install dependencies with npm install
3. create a .env file with this format:
  IMAP_USER=your-email@example.com
  IMAP_PASSWORD=your-email-password
  IMAP_HOST=imap.yourmail.com
  IMAP_PORT=993
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_KEY=your-service-role-key
4. run backend locally with node server.js

FRONTEND
1. in root folder, install dependencies with npm install
2. add .env.local file with this format:
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
3. Update fetch URL in src/app/page.tsx if testing locally to- fetch('http://localhost:8080/run-email-script', { method: 'POST' })
4. run app using npm run dev

