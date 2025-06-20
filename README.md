## Description
This app automates the extraction of loan data from incoming emails, specifically .csv and .xlsx attatchments, stores it in Supabase, 
and visualizes the data on a React dashboard. The email script runs through a button click on the frontend. It also runs automatically
via a Cron Job deployed on Render every 6 hours.

Notes
- To see script in action, you can delete all the loans and run the script using the buttons
- Keep in mind that the script takes quite a while to run on deployment, give it some time
- Can filter the loans by date
- Currently only works on csv/xlsx files that have this structure, with the columns Loan ID, Borrower, Requested, Funded, and Date -
  [mock_loans.xlsx](https://github.com/user-attachments/files/20733033/mock_loans.xlsx)
- For deployment, the script being used is in backend/scripts/fetchEmails.js, not scripts/fetchEmails.ts. Deploying using NextJS API routes has some challenges, so this was an easier solution. 

## Deployment/Demo
Frontend (deployed on Vercel):** [https://loan-app-teal.vercel.app](https://loan-app-teal.vercel.app/)
Backend (deployed on Render):** [https://loan-app-2bi1.onrender.com/](https://loan-app-2bi1.onrender.com/)

## Supabase Schema SQL
create table loans (
  id uuid primary key default gen_random_uuid(),
  loan_id text not null,
  borrower_name text,
  requested_amount numeric,
  funded_amount numeric,
  date timestamp
);


## Email Script
Email script is in backend/scripts/fetchEmails.js

## Manual setup instruction
1. install dependencies with command npm install
2. add a .env file with this format
   ```
   IMAP_USER=user
   IMAP_PASSWORD=password
   IMAP_HOST=imap.gmail.com
   IMAP_PORT=portvalue
   SUPABASE_URL=yoururl
   SUPABASE_SERVICE_KEY=yourservicekey
   ```
3. start application with command npm run dev


