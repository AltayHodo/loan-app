/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(): Promise<Response> {
  const scriptPath = path.resolve(process.cwd(), 'scripts/fetchEmails.ts');

  return new Promise((resolve) => {
    exec(`npx ts-node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error('Script error:', error);
        resolve(
          NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
          )
        );
      } else {
        console.log('Script output:', stdout);
        resolve(NextResponse.json({ success: true, output: stdout }));
      }
    });
  });
}
