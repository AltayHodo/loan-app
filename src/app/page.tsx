'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import LoanChart from '@/components/LoanChart';

type Loan = {
  loan_id: string;
  borrower_name: string;
  requested_amount: number;
  funded_amount: number;
  date: string;
};

export default function HomePage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [isRunningScript, setIsRunningScript] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLoans = async () => {
    const { data, error } = await supabase.from('loans').select('*');
    if (!error && data) setLoans(data);
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const filteredLoans = filterDate
    ? loans.filter((loan) => new Date(loan.date) >= new Date(filterDate))
    : loans;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center text-gray-800">
          Loan Dashboard
        </h1>

        <div className="mb-6 flex flex-wrap gap-4">
          <button
            disabled={isRunningScript}
            className={`bg-blue-600 text-white px-4 py-2 rounded transition ${
              isRunningScript
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-700'
            }`}
            onClick={async () => {
              setIsRunningScript(true);
              try {
                const res = await fetch(
                  'http://localhost:8080/run-email-script',
                  {
                    method: 'POST',
                  }
                );
                const data = await res.json();
                alert(
                  data.success
                    ? 'Email script ran successfully!'
                    : `Error: ${data.error}`
                );
                await fetchLoans();
              } finally {
                setIsRunningScript(false);
              }
            }}
          >
            {isRunningScript ? 'Running...' : 'Run Email Script'}
          </button>

          <button
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true);
              const { error } = await supabase
                .from('loans')
                .delete()
                .neq('loan_id', '');
              if (error) {
                console.error('Failed to delete loans:', error.message);
              } else {
                setLoans([]);
              }
              setIsDeleting(false);
            }}
            className={`bg-red-600 text-white px-4 py-2 rounded transition ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
            }`}
          >
            {isDeleting ? 'Deleting...' : 'Delete All Loans'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="date-filter"
              className="text-sm text-gray-700 font-medium"
            >
              Show loans since:
            </label>
            <input
              id="date-filter"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800"
            />
          </div>

          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto shadow rounded-lg bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-sm font-medium text-gray-600">
              <tr>
                <th className="px-4 py-3 border-b">Loan ID</th>
                <th className="px-4 py-3 border-b">Borrower</th>
                <th className="px-4 py-3 border-b">Requested</th>
                <th className="px-4 py-3 border-b">Funded</th>
                <th className="px-4 py-3 border-b">Date</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {filteredLoans.map((loan) => (
                <tr key={loan.loan_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b">{loan.loan_id}</td>
                  <td className="px-4 py-3 border-b">{loan.borrower_name}</td>
                  <td className="px-4 py-3 border-b">
                    ${loan.requested_amount}
                  </td>
                  <td className="px-4 py-3 border-b">${loan.funded_amount}</td>
                  <td className="px-4 py-3 border-b">
                    {loan.date.slice(0, 10)}
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">
                    No loans found for selected date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-12">
          <LoanChart loans={filteredLoans} filterDate={filterDate} />
        </div>
      </div>
    </main>
  );
}
