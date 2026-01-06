import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Deck, Card, Comment } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { Button, Input, TextArea, AlertBanner, Avatar } from '../components/UI';

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
    const data = await supabaseService.getDecks(undefined, true, term);
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

      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div className="relative flex items-center group">
          {/* Search Icon */}
          <div className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            placeholder="Search decks by title, description, or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-32 py-4 text-base bg-white border-2 border-gray-200 rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
          />

          {/* Search Button */}
          <button
            type="submit"
            className="absolute right-2 px-6 py-2.5 bg-primary text-white font-medium rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            Search
          </button>
        </div>

      </form>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : decks.length === 0 ? (
        <div className="text-center text-textSecondary mt-8">No public decks found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <div key={deck.id} className="bg-surface rounded-lg shadow hover:shadow-lg transition-all p-5 border border-gray-100 h-full flex flex-col relative">
              <Link to={`/public/${deck.id}`}>
                <h3 className="text-lg font-bold text-textPrimary truncate mb-1">{deck.title}</h3>
              </Link>
              <div className="mb-2 text-xs text-textSecondary flex items-center gap-1 z-10">
                by <Link to={`/profile/${deck.ownerId}`} className="font-medium text-primary hover:underline">{deck.ownerName}</Link>
              </div>
              <div className="flex items-center mb-3 space-x-2">
                <StarRating value={Math.round(deck.averageRating)} readonly />
                <span className="text-xs text-gray-500">({deck.ratingCount})</span>
              </div>
              <p className="text-sm text-textSecondary line-clamp-3 mb-4">{deck.description}</p>

              <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-50">
                <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">{deck.cardCount} cards</span>
                <Link to={`/public/${deck.id}`} className="text-xs text-primary font-medium hover:underline">View Deck &rarr;</Link>
              </div>
            </div>
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
      supabaseService.getDeckById(id).then(d => {
        if (!d || (!d.isPublic && d.ownerId !== user?.id && !user?.isAdmin)) {
          navigate('/public');
          return;
        }
        setDeck(d);
      });
      supabaseService.getCards(id).then(setCards);
      supabaseService.getComments(id).then(setComments);
      if (user) {
        supabaseService.getUserRating(id, user.id).then(setUserRating);
      }
    }
  }, [id, user, navigate]);

  const handleClone = async () => {
    if (!user || !deck) return;
    if (confirm(`Clone "${deck.title}" to your library?`)) {
      try {
        await supabaseService.cloneDeck(deck.id, user.id, user.displayName);
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
    await supabaseService.rateDeck(deck.id, user.id, val);
    // Refresh deck stats
    supabaseService.getDeckById(deck.id).then(d => d && setDeck(d));
  };

  const handlePostComment = async () => {
    if (!user || !deck || !newComment.trim()) return;
    await supabaseService.postComment(deck.id, user.id, user.displayName, newComment);
    setNewComment('');
    supabaseService.getComments(deck.id).then(setComments);
  };

  if (!deck) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-surface p-6 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">{deck.title}</h1>
            <p className="text-textSecondary mt-1">
              Created by <Link to={`/profile/${deck.ownerId}`} className="font-medium text-primary hover:underline">{deck.ownerName}</Link>
              <div className="text-sm mt-1">
                <span>Created: {new Date(deck.createdAt).toLocaleDateString()}</span>
                <span className="mx-2 text-gray-300">|</span>
                <span>Updated: {new Date(deck.updatedAt).toLocaleDateString()}</span>
              </div>
            </p>
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
              <hr className="my-2 border-gray-100" />
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
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${c.userId}`} className="font-bold text-sm hover:underline text-primary">{c.userName}</Link>
                </div>
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