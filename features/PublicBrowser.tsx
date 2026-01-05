import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Deck, Card, Comment } from '../types';
import { mockBackend } from '../services/mockDataService';
import { useAuth } from '../context/AuthContext';
import { Button, Input, TextArea, AlertBanner } from '../components/UI';

// --- STAR RATING COMPONENT ---
const StarRating: React.FC<{ value: number; onChange?: (val: number) => void; readonly?: boolean }> = ({ value, onChange, readonly }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange && onChange(star)}
          className={`focus:outline-none ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
          disabled={readonly}
        >
          <svg className={`w-5 h-5 ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

// --- PUBLIC CATALOG ---
export const PublicCatalog: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async (term = '') => {
    setLoading(true);
    const data = await mockBackend.getDecks(undefined, true, term);
    setDecks(data);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDecks(search);
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-textPrimary mb-2">Public Deck Catalog</h1>
        <p className="text-textSecondary">Discover and clone flashcard decks from the community.</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
        <Input 
          placeholder="Search by title or tag..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="flex-grow mb-0"
        />
        <Button type="submit">Search</Button>
      </form>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : decks.length === 0 ? (
        <div className="text-center text-textSecondary mt-8">No public decks found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <Link key={deck.id} to={`/public/${deck.id}`} className="block">
              <div className="bg-surface rounded-lg shadow hover:shadow-lg transition-all p-5 border border-gray-100 h-full flex flex-col">
                <h3 className="text-lg font-bold text-textPrimary truncate">{deck.title}</h3>
                <p className="text-xs text-textSecondary mb-2">by {deck.ownerName}</p>
                <div className="flex items-center mb-3 space-x-2">
                   <StarRating value={Math.round(deck.averageRating)} readonly />
                   <span className="text-xs text-gray-500">({deck.ratingCount})</span>
                </div>
                <p className="text-sm text-textSecondary line-clamp-3 mb-4">{deck.description}</p>
                <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-50">
                   <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">{deck.cardCount} cards</span>
                   <span className="text-xs text-primary font-medium group-hover:underline">View Deck &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// --- DECK DETAIL (PUBLIC) ---
export const DeckDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (id) {
      mockBackend.getDeckById(id).then(d => {
        if (!d || (!d.isPublic && d.ownerId !== user?.id && !user?.isAdmin)) {
             navigate('/public');
             return;
        }
        setDeck(d);
      });
      mockBackend.getCards(id).then(setCards);
      mockBackend.getComments(id).then(setComments);
      if (user) {
        mockBackend.getUserRating(id, user.id).then(setUserRating);
      }
    }
  }, [id, user, navigate]);

  const handleClone = async () => {
    if (!user || !deck) return;
    if (confirm(`Clone "${deck.title}" to your library?`)) {
      try {
        await mockBackend.cloneDeck(deck.id, user.id, user.displayName);
        alert('Deck cloned successfully! Check your dashboard.');
        navigate('/dashboard');
      } catch (e) {
        alert('Failed to clone deck.');
      }
    }
  };

  const handleRate = async (val: number) => {
    if (!user || !deck) return;
    setUserRating(val);
    await mockBackend.rateDeck(deck.id, user.id, val);
    // Refresh deck stats
    mockBackend.getDeckById(deck.id).then(d => d && setDeck(d));
  };

  const handlePostComment = async () => {
    if (!user || !deck || !newComment.trim()) return;
    await mockBackend.postComment(deck.id, user.id, user.displayName, newComment);
    setNewComment('');
    mockBackend.getComments(deck.id).then(setComments);
  };

  if (!deck) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       {/* Header */}
       <div className="bg-surface p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
             <div>
                <h1 className="text-3xl font-bold text-textPrimary">{deck.title}</h1>
                <p className="text-textSecondary mt-1">Created by <span className="font-medium text-textPrimary">{deck.ownerName}</span></p>
                <div className="flex items-center mt-3 gap-3">
                   <div className="flex items-center gap-1">
                      <StarRating value={userRating} onChange={handleRate} />
                      <span className="text-xs text-gray-400">(Your Rating)</span>
                   </div>
                   <span className="text-gray-300">|</span>
                   <span className="text-sm font-medium">Avg: {deck.averageRating} ({deck.ratingCount} ratings)</span>
                </div>
             </div>
             <div className="flex gap-2">
                <Button variant="secondary" onClick={() => navigate('/public')}>Back</Button>
                {user && <Button onClick={handleClone}>Clone Deck</Button>}
             </div>
          </div>
          <p className="mt-6 text-gray-700 leading-relaxed">{deck.description || 'No description provided.'}</p>
       </div>

       {/* Cards Preview (Read Only) */}
       <div className="space-y-4">
          <h2 className="text-xl font-bold">Cards Preview ({cards.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {cards.map(c => (
                <div key={c.id} className="bg-white p-4 rounded border border-gray-200 text-sm">
                   <p className="font-bold text-gray-900 mb-2">{c.front}</p>
                   <hr className="my-2 border-gray-100"/>
                   <p className="text-gray-600">{c.back}</p>
                </div>
             ))}
          </div>
       </div>

       {/* Comments */}
       <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Comments</h2>
          {user && (
             <div className="mb-6 flex gap-2">
                <div className="flex-grow">
                   <Input 
                     placeholder="Add a comment..." 
                     value={newComment} 
                     onChange={e => setNewComment(e.target.value)}
                     className="mb-0 bg-white"
                   />
                </div>
                <Button onClick={handlePostComment} disabled={!newComment.trim()}>Post</Button>
             </div>
          )}
          <div className="space-y-4">
             {comments.length === 0 && <p className="text-gray-500 italic">No comments yet.</p>}
             {comments.map(c => (
                <div key={c.id} className="bg-white p-3 rounded shadow-sm">
                   <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-sm">{c.userName}</span>
                      <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                   </div>
                   <p className="text-sm text-gray-700">{c.content}</p>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};