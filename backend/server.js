/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */

const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.post('/run-email-script', (_, res) => {
  const scriptPath = path.join(__dirname, 'scripts', 'fetchEmails.js');

  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error('Script error:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log('Script output:', stdout);
    res.status(200).json({ success: true, output: stdout });
  });
});

app.get('/', (_, res) => {
  res.send('Loan backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
