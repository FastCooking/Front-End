import EmptyState from "./EmptyState";
import Spinner from "./Spinner";

export function DataTable({
  columns = [],
  rows = [],
  rowKey = (row, idx) => row.id || idx,
  loading = false,
  loadingLabel = "Carregando registros...",
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription,
  emptyIcon,
  className = "",
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-brand-soft/70 text-xs uppercase text-brand border-b border-gray-200/80">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`px-5 py-3.5 font-semibold whitespace-nowrap ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  } ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length || 1} className="py-12 text-center">
                  <Spinner size="lg" label={loadingLabel} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => (
                <tr
                  key={rowKey(row, rIdx)}
                  className="hover:bg-surface/60 transition-colors"
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      className={`px-5 py-3.5 ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      } ${col.cellClassName || ""}`}
                    >
                      {col.render ? col.render(row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
