import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Deck } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Avatar, Button, Input, TextArea, AlertBanner } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, updateUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const user = await supabaseService.getUserById(userId);
        if (user) {
          setProfileUser(user);
          // Load public decks for this user
          const allDecks = await supabaseService.getDecks(userId);
          
          if (currentUser?.id === userId) {
             setDecks(allDecks);
          } else {
             setDecks(allDecks.filter(d => d.isPublic && !d.isHiddenByAdmin));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, currentUser]);

  const handleEditClick = () => {
    if (profileUser) {
        setEditForm({
            displayName: profileUser.displayName,
            bio: profileUser.bio || ''
        });
        setIsEditing(true);
        setError('');
    }
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setError('');
  };

  const handleSaveProfile = async () => {
      if (!editForm.displayName.trim()) {
          setError('Display name is required');
          return;
      }

      setSaveLoading(true);
      try {
          const updatedUser = await supabaseService.updateUserProfile(profileUser!.id, {
              displayName: editForm.displayName,
              bio: editForm.bio
          });
          
          // Update Local Component State
          setProfileUser(updatedUser);
          
          // Update Global Auth Context
          updateUser({ displayName: editForm.displayName, bio: editForm.bio });

          setIsEditing(false);
      } catch (e: any) {
          setError(e.message || "Failed to save profile");
      } finally {
          setSaveLoading(false);
      }
  };

  if (loading) return <div className="text-center mt-10">Loading profile...</div>;
  if (!profileUser) return <div className="text-center mt-10">User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-surface rounded-lg shadow-sm border border-gray-100 p-8">
        
        {isEditing ? (
            // EDIT MODE
            <div className="space-y-4 max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
                {error && <AlertBanner type="error" message={error} />}
                
                <div className="flex items-center gap-4 mb-4">
                     <Avatar name={editForm.displayName || profileUser.loginName} url={profileUser.profilePicture} size="lg" />
                     <div className="text-sm text-textSecondary italic">
                         (Profile picture editing not supported in demo)
                     </div>
                </div>

                <Input 
                    label="Display Name" 
                    value={editForm.displayName} 
                    onChange={e => setEditForm({...editForm, displayName: e.target.value})}
                    maxLength={40}
                />
                <TextArea 
                    label="Bio" 
                    value={editForm.bio}
                    onChange={e => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    rows={4}
                />
                
                <div className="flex gap-3 pt-2">
                    <Button onClick={handleSaveProfile} isLoading={saveLoading}>Save Changes</Button>
                    <Button variant="ghost" onClick={handleCancelEdit} disabled={saveLoading}>Cancel</Button>
                </div>
            </div>
        ) : (
            // VIEW MODE
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="flex-shrink-0">
                    <Avatar name={profileUser.displayName} url={profileUser.profilePicture} size="xl" />
                </div>
                <div className="flex-grow text-center md:text-left space-y-2">
                    <h1 className="text-3xl font-bold text-textPrimary">{profileUser.displayName}</h1>
                    <p className="text-textSecondary">@{profileUser.loginName}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 mt-2">
                        <span>Joined {new Date(profileUser.createdAt || Date.now()).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{decks.length} Decks Created</span>
                    </div>
                    {profileUser.bio && (
                        <p className="text-gray-700 mt-4 max-w-lg whitespace-pre-line">{profileUser.bio}</p>
                    )}
                </div>
                {currentUser?.id === profileUser.id && (
                    <div className="flex-shrink-0">
                        <Button variant="secondary" onClick={handleEditClick}>Edit Profile</Button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* User's Decks */}
      <div>
        <h2 className="text-2xl font-bold mb-6">{currentUser?.id === profileUser.id ? 'My Decks' : `Decks by ${profileUser.displayName}`}</h2>
        {decks.length === 0 ? (
          <p className="text-textSecondary italic">No decks to show.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map(deck => (
              <Link key={deck.id} to={deck.isPublic ? `/public/${deck.id}` : `/decks/${deck.id}/edit`} className="block">
                <div className="bg-surface rounded-lg shadow hover:shadow-lg transition-all p-5 border border-gray-100 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-textPrimary truncate">{deck.title}</h3>
                      {!deck.isPublic && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Private</span>}
                  </div>
                  <p className="text-sm text-textSecondary line-clamp-2 mb-4">{deck.description || 'No description'}</p>
                  <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-50">
                    <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">{deck.cardCount} cards</span>
                    <span className="text-xs text-primary font-medium group-hover:underline">View &rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};