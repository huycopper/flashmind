import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { Deck, Card } from '../types';
import { Button } from '../components/UI';

export const StudySession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (id) {
      supabaseService.getDeckById(id).then(setDeck);
      supabaseService.getCards(id).then(c => {
          setCards(c);
          if (c.length === 0) setIsFinished(true);
      });
    }
  }, [id]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 150);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  if (!deck) return <div className="p-8 text-center">Loading deck...</div>;
  if (cards.length === 0 && !isFinished) return <div className="p-8 text-center">No cards in this deck. <Link to={`/decks/${id}/edit`} className="text-primary underline">Add some!</Link></div>;

  if (isFinished) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center bg-surface p-8 rounded-lg shadow">
        <h2 className="text-3xl font-bold text-primary mb-4">Great Job! 🎉</h2>
        <p className="text-lg text-textSecondary mb-8">You've reviewed all {cards.length} cards in <strong>{deck.title}</strong>.</p>
        <div className="space-x-4">
          <Link to="/dashboard"><Button variant="secondary">Back to Dashboard</Button></Link>
          <Button onClick={() => { setIsFinished(false); setCurrentIndex(0); setIsFlipped(false); }}>Study Again</Button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[80vh]">
       <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">{deck.title}</h2>
          <span className="text-sm text-textSecondary">{currentIndex + 1} / {cards.length}</span>
       </div>

       {/* Card Container with Perspective */}
       <div className="flex-grow relative perspective-1000 group cursor-pointer" onClick={handleFlip}>
          <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
             
             {/* Front */}
             <div className="absolute inset-0 backface-hidden bg-surface rounded-xl shadow-lg border border-gray-200 flex flex-col items-center justify-center p-8">
                <span className="absolute top-4 left-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Question</span>
                <p className="text-2xl sm:text-3xl text-center font-medium leading-relaxed">{currentCard.front}</p>
                <p className="absolute bottom-4 text-xs text-gray-400">Click to flip</p>
             </div>

             {/* Back */}
             <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col items-center justify-center p-8">
                <span className="absolute top-4 left-4 text-xs font-bold text-secondary uppercase tracking-wide">Answer</span>
                <p className="text-2xl sm:text-3xl text-center font-medium leading-relaxed text-gray-800">{currentCard.back}</p>
             </div>

          </div>
       </div>

       {/* Controls */}
       <div className="mt-8 flex justify-between items-center px-4">
           <Button variant="secondary" onClick={(e) => { e.stopPropagation(); handlePrev(); }} disabled={currentIndex === 0}>Previous</Button>
           <Button onClick={(e) => { e.stopPropagation(); handleFlip(); }} className="md:hidden">Flip</Button>
           <Button variant="primary" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
              {currentIndex === cards.length - 1 ? 'Finish' : 'Next'}
           </Button>
       </div>
    </div>
  );
};