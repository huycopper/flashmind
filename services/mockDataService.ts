import { User, Deck, Card, Comment, Rating, Warning } from '../types';

// Keys for LocalStorage
const STORAGE_KEYS = {
  USERS: 'flashmind_users',
  DECKS: 'flashmind_decks',
  CARDS: 'flashmind_cards',
  COMMENTS: 'flashmind_comments',
  RATINGS: 'flashmind_ratings',
  WARNINGS: 'flashmind_warnings',
  SESSION: 'flashmind_session'
};

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Initial Seed Data
const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const adminUser: User = {
      id: 'admin-1',
      loginName: 'admin',
      displayName: 'System Admin',
      passwordHash: 'admin123',
      isAdmin: true,
      isLocked: false,
      bio: 'I manage the platform.'
    };
    const studentUser: User = {
      id: 'user-1',
      loginName: 'student',
      displayName: 'Alex Student',
      passwordHash: 'pass123',
      isAdmin: false,
      isLocked: false,
      bio: 'Learning history and science.'
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([adminUser, studentUser]));

    const deck1: Deck = {
      id: 'deck-1',
      ownerId: 'user-1',
      ownerName: 'Alex Student',
      title: 'World War II Timeline',
      description: 'Key events from 1939 to 1945.',
      isPublic: true,
      isHiddenByAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['history', 'war'],
      cardCount: 2,
      averageRating: 0,
      ratingCount: 0
    };
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify([deck1]));

    const card1: Card = {
      id: 'card-1',
      deckId: 'deck-1',
      front: 'When did WWII start?',
      back: 'September 1, 1939 (Invasion of Poland)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const card2: Card = {
      id: 'card-2',
      deckId: 'deck-1',
      front: 'When was D-Day?',
      back: 'June 6, 1944',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify([card1, card2]));
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.WARNINGS, JSON.stringify([]));
  }
};

seedData();

// --- DATA ACCESS LAYER ---

const getItems = <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');
const setItems = <T>(key: string, items: T[]) => localStorage.setItem(key, JSON.stringify(items));

export const mockBackend = {
  // Auth
  login: async (loginName: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    const users = getItems<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.loginName === loginName && u.passwordHash === password);
    if (!user) throw new Error('Invalid credentials');
    if (user.isLocked) throw new Error('Account locked by admin');
    return user;
  },

  register: async (loginName: string, displayName: string, password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 500));
    const users = getItems<User>(STORAGE_KEYS.USERS);
    if (users.some(u => u.loginName === loginName)) throw new Error('Login name already taken');
    
    const newUser: User = {
      id: generateId(),
      loginName,
      displayName,
      passwordHash: password,
      isAdmin: false,
      isLocked: false
    };
    users.push(newUser);
    setItems(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  // Decks
  getDecks: async (userId?: string, publicOnly = false, search?: string): Promise<Deck[]> => {
    await new Promise(r => setTimeout(r, 300));
    let decks = getItems<Deck>(STORAGE_KEYS.DECKS);
    
    if (userId) {
      decks = decks.filter(d => d.ownerId === userId && !d.isHiddenByAdmin); // Owner sees their decks (unless completely removed, but spec says 'Removed by Admin' note, handled in UI)
      // Actually owner should see hidden decks too with a note.
      decks = getItems<Deck>(STORAGE_KEYS.DECKS).filter(d => d.ownerId === userId);
    } else if (publicOnly) {
      decks = decks.filter(d => d.isPublic && !d.isHiddenByAdmin);
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      decks = decks.filter(d => d.title.toLowerCase().includes(lowerSearch) || d.tags.some(t => t.toLowerCase().includes(lowerSearch)));
    }
    return decks;
  },

  getDeckById: async (id: string): Promise<Deck | null> => {
    const decks = getItems<Deck>(STORAGE_KEYS.DECKS);
    return decks.find(d => d.id === id) || null;
  },

  createDeck: async (deckData: Partial<Deck>): Promise<Deck> => {
    const decks = getItems<Deck>(STORAGE_KEYS.DECKS);
    const newDeck: Deck = {
      id: generateId(),
      ownerId: deckData.ownerId!,
      ownerName: deckData.ownerName!,
      title: deckData.title!,
      description: deckData.description || '',
      isPublic: false,
      isHiddenByAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: deckData.tags || [],
      cardCount: 0,
      averageRating: 0,
      ratingCount: 0
    };
    decks.push(newDeck);
    setItems(STORAGE_KEYS.DECKS, decks);
    return newDeck;
  },

  updateDeck: async (id: string, updates: Partial<Deck>): Promise<Deck> => {
    const decks = getItems<Deck>(STORAGE_KEYS.DECKS);
    const index = decks.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Deck not found');
    
    const updatedDeck = { ...decks[index], ...updates, updatedAt: new Date().toISOString() };
    decks[index] = updatedDeck;
    setItems(STORAGE_KEYS.DECKS, decks);
    return updatedDeck;
  },

  deleteDeck: async (id: string) => {
    let decks = getItems<Deck>(STORAGE_KEYS.DECKS);
    decks = decks.filter(d => d.id !== id);
    setItems(STORAGE_KEYS.DECKS, decks);
    
    // Cascade delete cards
    let cards = getItems<Card>(STORAGE_KEYS.CARDS);
    cards = cards.filter(c => c.deckId !== id);
    setItems(STORAGE_KEYS.CARDS, cards);
  },

  cloneDeck: async (originalDeckId: string, newOwnerId: string, newOwnerName: string): Promise<Deck> => {
    const originalDeck = await mockBackend.getDeckById(originalDeckId);
    if (!originalDeck) throw new Error('Deck not found');
    
    const newDeck = await mockBackend.createDeck({
      ownerId: newOwnerId,
      ownerName: newOwnerName,
      title: `${originalDeck.title} (Copy)`,
      description: originalDeck.description,
      tags: originalDeck.tags
    });

    const cards = await mockBackend.getCards(originalDeckId);
    const newCards = cards.map(c => ({
      ...c,
      id: generateId(),
      deckId: newDeck.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    const allCards = getItems<Card>(STORAGE_KEYS.CARDS);
    allCards.push(...newCards);
    setItems(STORAGE_KEYS.CARDS, allCards);
    
    // Update count
    await mockBackend.updateDeck(newDeck.id, { cardCount: newCards.length });
    
    return newDeck;
  },

  // Cards
  getCards: async (deckId: string): Promise<Card[]> => {
    const cards = getItems<Card>(STORAGE_KEYS.CARDS);
    return cards.filter(c => c.deckId === deckId);
  },

  createCard: async (cardData: Partial<Card>): Promise<Card> => {
    const cards = getItems<Card>(STORAGE_KEYS.CARDS);
    const newCard: Card = {
      id: generateId(),
      deckId: cardData.deckId!,
      front: cardData.front!,
      back: cardData.back!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    cards.push(newCard);
    setItems(STORAGE_KEYS.CARDS, cards);
    
    // Update deck count
    const decks = getItems<Deck>(STORAGE_KEYS.DECKS);
    const deck = decks.find(d => d.id === cardData.deckId);
    if (deck) {
      deck.cardCount++;
      setItems(STORAGE_KEYS.DECKS, decks);
    }
    
    return newCard;
  },

  updateCard: async (id: string, updates: Partial<Card>): Promise<Card> => {
    const cards = getItems<Card>(STORAGE_KEYS.CARDS);
    const index = cards.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Card not found');
    
    const updated = { ...cards[index], ...updates, updatedAt: new Date().toISOString() };
    cards[index] = updated;
    setItems(STORAGE_KEYS.CARDS, cards);
    return updated;
  },

  deleteCard: async (id: string, deckId: string) => {
    let cards = getItems<Card>(STORAGE_KEYS.CARDS);
    cards = cards.filter(c => c.id !== id);
    setItems(STORAGE_KEYS.CARDS, cards);
    
     // Update deck count
     const decks = getItems<Deck>(STORAGE_KEYS.DECKS);
     const deck = decks.find(d => d.id === deckId);
     if (deck) {
       deck.cardCount = Math.max(0, deck.cardCount - 1);
       setItems(STORAGE_KEYS.DECKS, decks);
     }
  },

  // Comments
  getComments: async (deckId: string): Promise<Comment[]> => {
    const comments = getItems<Comment>(STORAGE_KEYS.COMMENTS);
    return comments.filter(c => c.deckId === deckId && !c.isHiddenByAdmin).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  postComment: async (deckId: string, userId: string, userName: string, content: string): Promise<Comment> => {
    const comments = getItems<Comment>(STORAGE_KEYS.COMMENTS);
    const newComment: Comment = {
      id: generateId(),
      deckId,
      userId,
      userName,
      content,
      createdAt: new Date().toISOString(),
      isHiddenByAdmin: false
    };
    comments.push(newComment);
    setItems(STORAGE_KEYS.COMMENTS, comments);
    return newComment;
  },

  // Ratings
  rateDeck: async (deckId: string, userId: string, value: number) => {
    let ratings = getItems<Rating>(STORAGE_KEYS.RATINGS);
    const existingIndex = ratings.findIndex(r => r.deckId === deckId && r.userId === userId);
    
    if (existingIndex >= 0) {
      ratings[existingIndex].value = value;
    } else {
      ratings.push({ deckId, userId, value });
    }
    setItems(STORAGE_KEYS.RATINGS, ratings);

    // Update Deck Stats
    const deckRatings = ratings.filter(r => r.deckId === deckId);
    const avg = deckRatings.reduce((acc, curr) => acc + curr.value, 0) / deckRatings.length;
    
    await mockBackend.updateDeck(deckId, { averageRating: parseFloat(avg.toFixed(1)), ratingCount: deckRatings.length });
  },

  getUserRating: async (deckId: string, userId: string): Promise<number> => {
    const ratings = getItems<Rating>(STORAGE_KEYS.RATINGS);
    const rating = ratings.find(r => r.deckId === deckId && r.userId === userId);
    return rating ? rating.value : 0;
  },

  // Admin
  getUsers: async (): Promise<User[]> => getItems<User>(STORAGE_KEYS.USERS),
  
  updateUserLock: async (userId: string, isLocked: boolean) => {
    const users = getItems<User>(STORAGE_KEYS.USERS);
    const u = users.find(x => x.id === userId);
    if(u) {
      u.isLocked = isLocked;
      setItems(STORAGE_KEYS.USERS, users);
    }
  },

  sendWarning: async (userId: string, adminId: string, reason: string) => {
    const warnings = getItems<Warning>(STORAGE_KEYS.WARNINGS);
    warnings.push({
      id: generateId(),
      userId,
      adminId,
      reason,
      isDismissed: false,
      createdAt: new Date().toISOString()
    });
    setItems(STORAGE_KEYS.WARNINGS, warnings);
  },

  getWarnings: async (userId: string): Promise<Warning[]> => {
    return getItems<Warning>(STORAGE_KEYS.WARNINGS).filter(w => w.userId === userId && !w.isDismissed);
  },

  dismissWarning: async (id: string) => {
    const warnings = getItems<Warning>(STORAGE_KEYS.WARNINGS);
    const w = warnings.find(x => x.id === id);
    if (w) {
      w.isDismissed = true;
      setItems(STORAGE_KEYS.WARNINGS, warnings);
    }
  }
};