import { useEffect, useState } from 'react';
import Icon from './Icon';
import EmptyState from './EmptyState';

/**
 * columns: [{ key, header, render?(row), className? }]
 * className supports "hide-sm" / "hide-md" to drop columns on small screens.
 */
export default function Table({ columns, rows, pageSize = 8, empty, rowKey = 'id', onRowClick }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [pages, page]);
  useEffect(() => setPage(1), [rows.length]);

  if (!rows.length) return empty || <EmptyState title="Nothing to show" />;

  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);

  return (
    <div className="table-block">
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.className}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row[rowKey]} className={onRowClick ? 'clickable' : ''} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {columns.map((c) => (
                  <td key={c.key} className={c.className} data-label={c.header}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > pageSize && (
        <div className="pager">
          <span>
            {start + 1}–{Math.min(start + pageSize, rows.length)} of {rows.length}
          </span>
          <div>
            <button type="button" className="icon-btn icon-btn-ghost icon-btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><Icon name="left" size={15} /></button>
            <span className="pager-page">{page} / {pages}</span>
            <button type="button" className="icon-btn icon-btn-ghost icon-btn-sm" disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next page"><Icon name="right" size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
