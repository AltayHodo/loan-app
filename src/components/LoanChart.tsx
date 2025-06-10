'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Props = {
  loans: {
    requested_amount: number;
    funded_amount: number;
  }[];
  filterDate?: string;
};

export default function LoanChart({ loans, filterDate }: Props) {
  const totalRequested = loans.reduce((sum, l) => sum + l.requested_amount, 0);
  const totalFunded = loans.reduce((sum, l) => sum + l.funded_amount, 0);

  const data = [
    { name: 'Requested', amount: totalRequested },
    { name: 'Funded', amount: totalFunded },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-2 text-gray-800">
        Total Requested vs. Funded
        {filterDate && (
          <span className="text-sm font-normal text-gray-600 ml-2">
            (since {filterDate})
          </span>
        )}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `$${value}`} />
          <Tooltip formatter={(value: number) => `$${value}`} />
          <Bar dataKey="amount" fill="#3182ce" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
