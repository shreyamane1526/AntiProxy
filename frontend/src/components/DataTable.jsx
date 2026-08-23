export default function DataTable({ columns, rows, empty }) {
  if (!rows?.length) {
    return empty || null
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-page text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0 hover:bg-page/70">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-navy">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
