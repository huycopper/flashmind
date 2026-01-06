import React, { useState, useEffect } from 'react';
import { User, Deck, Comment } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { Button, AlertBanner, Input } from '../components/UI';

export const AdminPanel: React.FC = () => {
    const { user: currentUser } = useAuth();

    // Data State
    const [users, setUsers] = useState<User[]>([]);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);

    // Search & Pagination State
    const [userSearch, setUserSearch] = useState('');
    const [deckSearch, setDeckSearch] = useState('');
    const [commentSearch, setCommentSearch] = useState('');

    const [userPage, setUserPage] = useState(1);
    const [deckPage, setDeckPage] = useState(1);
    const [commentPage, setCommentPage] = useState(1);

    const ITEMS_PER_PAGE = 5;

    // Warning State
    const [warningMsg, setWarningMsg] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setUsers(await supabaseService.getUsers());
        setDecks(await supabaseService.getAllDecksAdmin());
        setComments(await supabaseService.getAllCommentsAdmin());
    };

    // --- Actions ---
    const toggleLock = async (u: User) => {
        await supabaseService.updateUserLock(u.id, !u.isLocked);
        loadData();
    };

    const toggleDeckHide = async (d: Deck) => {
        await supabaseService.updateDeck(d.id, { isHiddenByAdmin: !d.isHiddenByAdmin });
        loadData();
    };

    const deleteDeck = async (d: Deck) => {
        if (!confirm(`Are you sure you want to delete deck "${d.title}"? This cannot be undone.`)) return;
        await supabaseService.deleteDeck(d.id);
        loadData();
    };

    const sendWarning = async () => {
        if (!selectedUser || !warningMsg) return;
        if (!currentUser) return;
        await supabaseService.sendWarning(selectedUser, currentUser.id, warningMsg);
        alert('Warning sent');
        setWarningMsg('');
        setSelectedUser(null);
    };

    const toggleCommentHide = async (c: Comment) => {
        await supabaseService.toggleCommentVisibility(c.id, !c.isHiddenByAdmin);
        loadData();
    };

    const deleteComment = async (c: Comment) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        await supabaseService.deleteComment(c.id);
        loadData();
    };

    // --- Helper for Filtering & Pagination ---
    const getPaginatedData = <T,>(data: T[], searchQuery: string, page: number, searchKeys: (keyof T)[]) => {
        const filtered = data.filter(item => {
            const query = searchQuery.toLowerCase();
            return searchKeys.some(key => {
                const val = item[key];
                return String(val).toLowerCase().includes(query);
            });
        });

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const currentData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return { currentData, totalPages, totalItems: filtered.length };
    };

    // Derived Data
    const { currentData: paginatedUsers, totalPages: userTotalPages } = getPaginatedData<User>(users, userSearch, userPage, ['displayName', 'loginName']);
    const { currentData: paginatedDecks, totalPages: deckTotalPages } = getPaginatedData<Deck>(decks, deckSearch, deckPage, ['title', 'ownerName']);
    const { currentData: paginatedComments, totalPages: commentTotalPages } = getPaginatedData<Comment>(comments, commentSearch, commentPage, ['content', 'userName', 'deckTitle']);

    // --- Pagination Component ---
    const PaginationControls: React.FC<{ page: number; totalPages: number; setPage: (p: number) => void }> = ({ page, totalPages, setPage }) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex justify-between items-center mt-4 text-sm">
                <span className="text-gray-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page === 1} className="py-1 px-3">Prev</Button>
                    <Button variant="secondary" onClick={() => setPage(page + 1)} disabled={page === totalPages} className="py-1 px-3">Next</Button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Admin Panel</h1>

            {/* User Management */}
            <div className="bg-surface p-6 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold">Users</h2>
                    <Input
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                        className="mb-0 w-full sm:w-64"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left">
                                <th className="p-2">Name</th>
                                <th className="p-2">Login</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.length > 0 ? paginatedUsers.map(u => (
                                <tr key={u.id} className="border-t">
                                    <td className="p-2">{u.displayName} {u.isAdmin && <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">Admin</span>}</td>
                                    <td className="p-2">{u.loginName}</td>
                                    <td className="p-2">
                                        {u.isLocked ? <span className="text-red-600 font-bold">LOCKED</span> : <span className="text-green-600">Active</span>}
                                    </td>
                                    <td className="p-2 space-x-2">
                                        {!u.isAdmin && (
                                            <>
                                                <Button
                                                    variant="danger"
                                                    className="text-xs py-1 px-2"
                                                    onClick={() => toggleLock(u)}
                                                >
                                                    {u.isLocked ? 'Unlock' : 'Lock'}
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="text-xs py-1 px-2"
                                                    onClick={() => setSelectedUser(u.id)}
                                                >
                                                    Warn
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="p-4 text-center text-gray-500">No users found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls page={userPage} totalPages={userTotalPages} setPage={setUserPage} />

                {selectedUser && (
                    <div className="mt-4 bg-gray-50 p-4 rounded border">
                        <h3 className="font-bold text-sm mb-2">Send Warning to User</h3>
                        <div className="flex gap-2">
                            <Input
                                value={warningMsg}
                                onChange={e => setWarningMsg(e.target.value)}
                                placeholder="Reason for warning..."
                                className="mb-0 flex-grow"
                            />
                            <Button onClick={sendWarning}>Send</Button>
                            <Button variant="ghost" onClick={() => setSelectedUser(null)}>Cancel</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Deck Moderation */}
            <div className="bg-surface p-6 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold">All Decks</h2>
                    <Input
                        placeholder="Search decks..."
                        value={deckSearch}
                        onChange={e => { setDeckSearch(e.target.value); setDeckPage(1); }}
                        className="mb-0 w-full sm:w-64"
                    />
                </div>

                <div className="space-y-2">
                    {paginatedDecks.length > 0 ? paginatedDecks.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-3 border rounded bg-white">
                            <div>
                                <div>
                                    <span className="font-bold">{d.title}</span>
                                    <span className="text-gray-500 text-xs ml-2">by {d.ownerName}</span>
                                    {d.isPublic && <span className="text-xs bg-green-100 text-green-800 ml-2 px-1 rounded">Public</span>}
                                    {d.isHiddenByAdmin && <span className="text-xs bg-red-100 text-red-800 ml-2 px-1 rounded">Hidden</span>}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                    Created: {new Date(d.createdAt).toLocaleDateString()} &bull; Updated: {new Date(d.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={d.isHiddenByAdmin ? 'primary' : 'danger'}
                                    className="text-xs py-1 px-2"
                                    onClick={() => toggleDeckHide(d)}
                                >
                                    {d.isHiddenByAdmin ? 'Show' : 'Hide'}
                                </Button>
                                <Button
                                    variant="danger"
                                    className="text-xs py-1 px-2"
                                    onClick={() => deleteDeck(d)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-gray-500 py-4">No decks found</div>
                    )}
                </div>
                <PaginationControls page={deckPage} totalPages={deckTotalPages} setPage={setDeckPage} />
            </div>

            {/* Comment Moderation */}
            <div className="bg-surface p-6 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold">All Comments</h2>
                    <Input
                        placeholder="Search comments..."
                        value={commentSearch}
                        onChange={e => { setCommentSearch(e.target.value); setCommentPage(1); }}
                        className="mb-0 w-full sm:w-64"
                    />
                </div>

                <div className="space-y-2">
                    {paginatedComments.length > 0 ? paginatedComments.map(c => (
                        <div key={c.id} className="flex justify-between items-start p-3 border rounded bg-white">
                            <div>
                                <div className="text-sm font-bold">{c.userName} <span className="font-normal text-gray-500">on deck {c.deckTitle}</span></div>
                                <div className="text-gray-800 my-1">{c.content}</div>
                                {c.isHiddenByAdmin && <span className="text-xs bg-red-100 text-red-800 px-1 rounded">Hidden</span>}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={c.isHiddenByAdmin ? 'primary' : 'danger'}
                                    className="text-xs py-1 px-2"
                                    onClick={() => toggleCommentHide(c)}
                                >
                                    {c.isHiddenByAdmin ? 'Show' : 'Hide'}
                                </Button>
                                <Button
                                    variant="danger"
                                    className="text-xs py-1 px-2"
                                    onClick={() => deleteComment(c)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-gray-500 py-4">No comments found</div>
                    )}
                </div>
                <PaginationControls page={commentPage} totalPages={commentTotalPages} setPage={setCommentPage} />
            </div>
        </div>
    );
};