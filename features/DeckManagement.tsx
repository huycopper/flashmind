import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Deck, Card } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { Button, Input, TextArea, AlertBanner, Modal } from '../components/UI';
import { aiService } from '../services/aiService';

// --- DASHBOARD ---
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      supabaseService.getDecks(user.id).then(setDecks);
      supabaseService.getWarnings(user.id).then(setWarnings);
    }
  }, [user]);

  const handleDismissWarning = async (id: string) => {
      await supabaseService.dismissWarning(id);
      setWarnings(warnings.filter(w => w.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-textPrimary">My Decks</h1>
        <Link to="/decks/new">
          <Button>+ Create Deck</Button>
        </Link>
      </div>

      {warnings.length > 0 && (
          <div className="space-y-2">
              {warnings.map(w => (
                  <AlertBanner 
                    key={w.id} 
                    type="warning" 
                    message={`Admin Warning: ${w.reason}`} 
                    onDismiss={() => handleDismissWarning(w.id)}
                  />
              ))}
          </div>
      )}

      {decks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-textSecondary">You haven't created any decks yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <div key={deck.id} className="bg-surface rounded-lg shadow hover:shadow-md transition-shadow p-5 border border-gray-100 flex flex-col h-full">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-textPrimary truncate" title={deck.title}>{deck.title}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${deck.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {deck.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
              <p className="text-textSecondary text-sm mb-4 flex-grow line-clamp-2">{deck.description || 'No description'}</p>
              {deck.isHiddenByAdmin && (
                  <div className="mb-2 text-xs text-warning font-semibold bg-red-50 p-1 rounded">
                      Removed by Admin
                  </div>
              )}
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                <span className="text-xs text-textSecondary">{deck.cardCount} cards</span>
                <div className="space-x-2">
                   <Link to={`/decks/${deck.id}/edit`}>
                     <Button variant="secondary" className="text-xs px-2 py-1">Edit</Button>
                   </Link>
                   <Link to={`/decks/${deck.id}/study`}>
                     <Button className="text-xs px-2 py-1">Study</Button>
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- DECK EDITOR ---
export const DeckEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deck, setDeck] = useState<Partial<Deck>>({ title: '', description: '', isPublic: false, tags: [] });
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Card Edit State
  const [editingCard, setEditingCard] = useState<Partial<Card> | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      loadDeckData(id);
    }
  }, [id, isNew]);

  const loadDeckData = async (deckId: string) => {
    try {
      const d = await supabaseService.getDeckById(deckId);
      if (d) {
          if (d.ownerId !== user?.id) {
              alert("You cannot edit a deck you do not own.");
              navigate('/dashboard');
              return;
          }
          setDeck(d);
          const c = await supabaseService.getCards(deckId);
          setCards(c);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveDeck = async () => {
    if (!deck.title) return alert('Title is required');
    setLoading(true);
    setError(null);
    try {
      if (isNew) {
        const newDeck = await supabaseService.createDeck({ ...deck, ownerId: user!.id, ownerName: user!.displayName });
        navigate(`/decks/${newDeck.id}/edit`, { replace: true });
      } else {
        await supabaseService.updateDeck(id!, deck);
        alert('Deck saved successfully');
      }
    } catch (e: any) {
      console.error('Save deck error:', e);
      setError(e.message || 'Failed to save deck');
      alert('Error: ' + (e.message || 'Failed to save deck'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeck = async () => {
    if (confirm('Are you sure? This will delete all cards and data.')) {
        await supabaseService.deleteDeck(id!);
        navigate('/dashboard');
    }
  };

  // Card Logic
  const openCardModal = (card?: Card) => {
      setEditingCard(card || { front: '', back: '' });
      setAiSuggestion(null);
      setIsCardModalOpen(true);
  };

  const saveCard = async () => {
      if (!editingCard?.front || !editingCard?.back) return;
      try {
          if (editingCard.id) {
             const updated = await supabaseService.updateCard(editingCard.id, editingCard);
             setCards(cards.map(c => c.id === updated.id ? updated : c));
          } else {
             const created = await supabaseService.createCard({ ...editingCard, deckId: isNew ? 'temp' : id! }); // Edge case for new deck
             setCards([...cards, created]);
          }
          setIsCardModalOpen(false);
      } catch(e) { console.error(e); }
  };

  const deleteCard = async (cardId: string) => {
      if(confirm('Delete card?')) {
          await supabaseService.deleteCard(cardId, id!);
          setCards(cards.filter(c => c.id !== cardId));
      }
  };

  // AI Logic
  const askAi = async () => {
      if (!editingCard?.front) return alert('Enter a question/term first.');
      setAiLoading(true);
      setAiSuggestion(null);
      try {
          const answer = await aiService.generateAnswer(editingCard.front, `${deck.title} - ${deck.description}`);
          setAiSuggestion(answer);
      } catch (e) {
          alert("AI Error: " + (e as Error).message);
      } finally {
          setAiLoading(false);
      }
  };

  const acceptAi = () => {
      if (aiSuggestion) {
          setEditingCard(prev => ({ ...prev, back: aiSuggestion }));
          setAiSuggestion(null);
      }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Deck Metadata Form */}
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{isNew ? 'Create New Deck' : 'Edit Deck'}</h2>
            {!isNew && <Button variant="danger" onClick={handleDeleteDeck}>Delete Deck</Button>}
        </div>
        {error && <AlertBanner type="error" message={error} />}
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Title" 
                  value={deck.title} 
                  onChange={e => setDeck({ ...deck, title: e.target.value })} 
                />
                <div className="flex items-center pt-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={deck.isPublic} 
                          onChange={e => setDeck({ ...deck, isPublic: e.target.checked })}
                          className="form-checkbox h-5 w-5 text-primary rounded"
                          disabled={deck.isHiddenByAdmin}
                        />
                        <span className="text-sm font-medium text-textPrimary">Make Public</span>
                    </label>
                    {deck.isHiddenByAdmin && <span className="ml-2 text-xs text-warning">(Disabled by Admin)</span>}
                </div>
            </div>
            <TextArea 
              label="Description" 
              value={deck.description} 
              onChange={e => setDeck({ ...deck, description: e.target.value })} 
            />
            <div className="flex justify-end">
                <Button onClick={handleSaveDeck} isLoading={loading}>Save Deck Settings</Button>
            </div>
        </div>
      </div>

      {/* Cards List */}
      {!isNew && (
        <div className="bg-surface p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Cards ({cards.length})</h3>
                <Button onClick={() => openCardModal()}>+ Add Card</Button>
            </div>
            <div className="space-y-3">
                {cards.map((card, idx) => (
                    <div key={card.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4 mr-4">
                            <div className="text-sm font-medium">{card.front}</div>
                            <div className="text-sm text-textSecondary truncate">{card.back}</div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                            <button onClick={() => openCardModal(card)} className="text-primary hover:text-blue-800">Edit</button>
                            <button onClick={() => deleteCard(card.id)} className="text-warning hover:text-red-800">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Card Modal */}
      <Modal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title={editingCard?.id ? 'Edit Card' : 'Add Card'}>
          <div className="space-y-4">
              <div className="relative">
                  <TextArea 
                    label="Front (Question/Term)" 
                    value={editingCard?.front || ''} 
                    onChange={e => setEditingCard({ ...editingCard, front: e.target.value })} 
                    className="min-h-[80px]"
                  />
                  <div className="absolute top-0 right-0">
                      <button 
                        onClick={askAi} 
                        disabled={aiLoading}
                        className="text-xs flex items-center bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition"
                        type="button"
                      >
                         {aiLoading ? 'Thinking...' : '✨ Ask AI'}
                      </button>
                  </div>
              </div>

              {aiSuggestion && (
                  <div className="bg-purple-50 p-3 rounded border border-purple-200 relative animate-fade-in">
                      <p className="text-xs font-bold text-purple-800 mb-1">AI Suggestion:</p>
                      <p className="text-sm text-purple-900 mb-2">{aiSuggestion}</p>
                      <div className="flex space-x-2 justify-end">
                           <button onClick={() => setAiSuggestion(null)} className="text-xs text-red-600 hover:underline">Ignore</button>
                           <button onClick={acceptAi} className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700">✓ Accept</button>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">AI output may contain errors; please review.</p>
                  </div>
              )}

              <TextArea 
                label="Back (Answer/Definition)" 
                value={editingCard?.back || ''} 
                onChange={e => setEditingCard({ ...editingCard, back: e.target.value })} 
                className="min-h-[100px]"
              />
              <div className="flex justify-end space-x-2">
                  <Button variant="secondary" onClick={() => setIsCardModalOpen(false)}>Cancel</Button>
                  <Button onClick={saveCard}>Save Card</Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};