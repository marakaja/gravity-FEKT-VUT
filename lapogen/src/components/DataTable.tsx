import { useLanguage } from "../context/LanguageContext";

export type Column<T> = {
  key: string;
  label: string;
  render: (item: T, index: number) => string | number;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  onDelete: (index: number) => void;
  emptyMessage?: string;
};

export function DataTable<T>({
  columns,
  data,
  onDelete,
  emptyMessage,
}: DataTableProps<T>) {
  const { t } = useLanguage();
  const resolvedEmptyMessage = emptyMessage ?? t.dataTableEmpty;
  return (
    <div className="max-h-64 overflow-auto rounded-md border border-slate-200">
      <table className="min-w-full text-sm text-slate-900">
        <thead className="bg-slate-50 sticky top-0">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-3 py-2 font-medium text-slate-700"
              >
                {col.label}
              </th>
            ))}
            <th className="text-left px-3 py-2 font-medium text-slate-700 w-20">
              {t.dataTableActions}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.length === 0 ? (
            <tr>
              <td
                className="px-3 py-3 text-slate-700"
                colSpan={columns.length + 1}
              >
                {resolvedEmptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx} className="odd:bg-white even:bg-slate-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    {col.render(item, idx)}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <button
                    onClick={() => onDelete(idx)}
                    className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-xs"
                  >
                    {t.dataTableDelete}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
