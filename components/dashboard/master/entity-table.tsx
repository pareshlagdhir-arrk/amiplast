'use client';

import * as React from 'react';

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
};

export function EntityTable<T>({
  columns,
  rows,
  rowKey,
  onEdit,
  onDelete,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-[#565f89]">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-[#2f3549]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#2f3549] text-left text-[#7aa2f7]">
            {columns.map((col) => (
              <th key={col.header} className="px-4 py-2 font-medium lowercase tracking-wide">
                {col.header}
              </th>
            ))}
            <th className="px-4 py-2 text-right font-medium lowercase tracking-wide">actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-[#2f3549] last:border-0 text-[#c0caf5]">
              {columns.map((col) => (
                <td key={col.header} className="px-4 py-2">
                  {col.cell(row)}
                </td>
              ))}
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => onEdit(row)}
                  className="mr-3 text-[#7aa2f7] hover:underline"
                >
                  edit
                </button>
                <button
                  onClick={() => onDelete(row)}
                  className="text-[#f7768e] hover:underline"
                >
                  delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
