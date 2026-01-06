import React, { useState, useEffect } from 'react';
import { User, Deck, Comment } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { Button, AlertBanner, Input } from '../components/UI';

import { DataTable } from '../components/DataTable';

export const AdminPanel: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
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

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Admin Panel</h1>

            {/* Users Table */}
            <DataTable<User>
                title="Users"
                data={users}
                searchKeys={['displayName', 'loginName']}
                columns={[
                    { header: 'Name' },
                    { header: 'Login' },
                    { header: 'Status' },
                    { header: 'Actions' }
                ]}
                renderRow={(u) => (
                    <tr key={u.id} className="border-t">
                        <td className="p-2">{u.displayName} {u.isAdmin && <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">Admin</span>}</td>
                        <td className="p-2">{u.loginName}</td>
                        <td className="p-2">
                            {u.isLocked ? <span className="text-red-600 font-bold">LOCKED</span> : <span className="text-green-600">Active</span>}
                        </td>
                        <td className="p-2 space-x-2">
                            {!u.isAdmin && (
                                <>
                                    <Button variant="danger" className="text-xs py-1 px-2" onClick={() => toggleLock(u)}>
                                        {u.isLocked ? 'Unlock' : 'Lock'}
                                    </Button>
                                    <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => setSelectedUser(u.id)}>
                                        Warn
                                    </Button>
                                </>
                            )}
                        </td>
                    </tr>
                )}
            />

            {/* Warning Modal/Input Area - kept outside the table for simplicity or could be integrating, but let's keep it separate for now */}
            {selectedUser && (
                <div className="bg-surface p-4 rounded border shadow-sm">
                    <h3 className="font-bold text-sm mb-2">Send Warning</h3>
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

            {/* Decks Table */}
            <DataTable<Deck>
                title="All Decks"
                data={decks}
                searchKeys={['title', 'ownerName']}
                columns={[
                    { header: 'Details', className: 'w-2/3' },
                    { header: 'Actions' }
                ]}
                renderRow={(d) => (
                    <tr key={d.id} className="border-t">
                        <td className="p-2">
                            <div>
                                <span className="font-bold">{d.title}</span>
                                <span className="text-gray-500 text-xs ml-2">by {d.ownerName}</span>
                                {d.isPublic && <span className="text-xs bg-green-100 text-green-800 ml-2 px-1 rounded">Public</span>}
                                {d.isHiddenByAdmin && <span className="text-xs bg-red-100 text-red-800 ml-2 px-1 rounded">Hidden</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                Created: {new Date(d.createdAt).toLocaleDateString()} &bull; Updated: {new Date(d.updatedAt).toLocaleDateString()}
                            </div>
                        </td>
                        <td className="p-2 space-x-2 align-top pt-3">
                            <Button variant={d.isHiddenByAdmin ? 'primary' : 'danger'} className="text-xs py-1 px-2" onClick={() => toggleDeckHide(d)}>
                                {d.isHiddenByAdmin ? 'Show' : 'Hide'}
                            </Button>
                            <Button variant="danger" className="text-xs py-1 px-2" onClick={() => deleteDeck(d)}>
                                Delete
                            </Button>
                        </td>
                    </tr>
                )}
            />

            {/* Comments Table */}
            <DataTable<Comment>
                title="All Comments"
                data={comments}
                searchKeys={['content', 'userName', 'deckTitle']}
                columns={[
                    { header: 'Comment', className: 'w-2/3' },
                    { header: 'Actions' }
                ]}
                renderRow={(c) => (
                    <tr key={c.id} className="border-t">
                        <td className="p-2">
                            <div className="text-sm font-bold">{c.userName} <span className="font-normal text-gray-500">on deck {c.deckTitle}</span></div>
                            <div className="text-gray-800 my-1">{c.content}</div>
                            {c.isHiddenByAdmin && <span className="text-xs bg-red-100 text-red-800 px-1 rounded">Hidden</span>}
                        </td>
                        <td className="p-2 space-x-2 align-top pt-3">
                            <Button variant={c.isHiddenByAdmin ? 'primary' : 'danger'} className="text-xs py-1 px-2" onClick={() => toggleCommentHide(c)}>
                                {c.isHiddenByAdmin ? 'Show' : 'Hide'}
                            </Button>
                            <Button variant="danger" className="text-xs py-1 px-2" onClick={() => deleteComment(c)}>
                                Delete
                            </Button>
                        </td>
                    </tr>
                )}
            />
        </div>
    );
};