import React, { useState, useEffect } from 'react';
import { User, Deck } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { Button, AlertBanner, Input } from '../components/UI';

export const AdminPanel: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [warningMsg, setWarningMsg] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setUsers(await supabaseService.getUsers());
        // Get all decks including hidden ones
        const allDecks = await supabaseService.getDecks(); // Returns all in mock implementation generally or filter needed
        // For mock, getDecks returns public usually. Let's assume we can fetch all for admin.
        // Re-using publicOnly=false
        setDecks(await supabaseService.getDecks(undefined, false)); 
    };

    const toggleLock = async (u: User) => {
        await supabaseService.updateUserLock(u.id, !u.isLocked);
        loadData();
    };

    const toggleDeckHide = async (d: Deck) => {
        await supabaseService.updateDeck(d.id, { isHiddenByAdmin: !d.isHiddenByAdmin });
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

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Admin Panel</h1>

            {/* User Management */}
            <div className="bg-surface p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Users</h2>
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
                            {users.map(u => (
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
                            ))}
                        </tbody>
                    </table>
                </div>

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
                <h2 className="text-xl font-bold mb-4">All Decks</h2>
                <div className="space-y-2">
                    {decks.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-3 border rounded bg-white">
                            <div>
                                <span className="font-bold">{d.title}</span>
                                <span className="text-gray-500 text-xs ml-2">by {d.ownerName}</span>
                                {d.isPublic && <span className="text-xs bg-green-100 text-green-800 ml-2 px-1 rounded">Public</span>}
                                {d.isHiddenByAdmin && <span className="text-xs bg-red-100 text-red-800 ml-2 px-1 rounded">Hidden</span>}
                            </div>
                            <Button 
                              variant={d.isHiddenByAdmin ? 'primary' : 'danger'} 
                              className="text-xs py-1 px-2"
                              onClick={() => toggleDeckHide(d)}
                            >
                                {d.isHiddenByAdmin ? 'Show' : 'Hide'}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};