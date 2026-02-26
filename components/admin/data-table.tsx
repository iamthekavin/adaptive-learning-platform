"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    onDelete?.(id);
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="text-xs font-bold uppercase tracking-widest text-white/20">
          Loading...
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.06]">
        <p className="text-xs font-bold uppercase tracking-widest text-white/20">
          No records found
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.04]">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30"
              >
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-white/30">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              className="border-b border-white/[0.02] transition-colors hover:bg-white/[0.02]"
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className="px-4 py-3 text-sm font-medium text-white/70"
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? "—")}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="rounded p-1.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deletingId === row.id}
                        className="rounded p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
