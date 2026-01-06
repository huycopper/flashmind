import React, { useState } from 'react';
import { Button, Input } from './UI';

interface DataTableProps<T> {
    title: string;
    data: T[];
    searchKeys: (keyof T)[];
    columns: { header: string; className?: string }[];
    renderRow: (item: T) => React.ReactNode;
    emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
    title,
    data,
    searchKeys,
    columns,
    renderRow,
    emptyMessage = 'No items found'
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const filtered = data.filter(item => {
        const query = search.toLowerCase();
        return searchKeys.some(key => {
            const val = item[key];
            return String(val).toLowerCase().includes(query);
        });
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const currentData = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="bg-surface p-6 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <Input
                    placeholder={`Search ${title.toLowerCase()}...`}
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="mb-0 w-full sm:w-64"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            {columns.map((col, idx) => (
                                <th key={idx} className={`p-2 ${col.className || ''}`}>{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.length > 0 ? currentData.map(renderRow) : (
                            <tr><td colSpan={columns.length} className="p-4 text-center text-gray-500">{emptyMessage}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 text-sm">
                    <span className="text-gray-500">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="py-1 px-3">Prev</Button>
                        <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="py-1 px-3">Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
