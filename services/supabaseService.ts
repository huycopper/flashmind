import { supabase } from './supabaseClient';
import { User, Deck, Card, Comment, Rating, Warning } from '../types';

// Database table names (adjust based on your Supabase schema)
const TABLES = {
  USERS: 'users',
  DECKS: 'decks',
  CARDS: 'cards',
  COMMENTS: 'comments',
  RATINGS: 'ratings',
  WARNINGS: 'warnings',
};

// Helper to map Supabase user to our User type
const mapSupabaseUser = (user: any): User => ({
  id: user.id,
  loginName: user.login_name || user.email?.split('@')[0] || '',
  displayName: user.display_name || user.email?.split('@')[0] || '',
  passwordHash: '', // Not stored in Supabase, handled by auth
  isAdmin: user.is_admin || false,
  isLocked: user.is_locked || false,
  profilePicture: user.profile_picture || undefined,
  bio: user.bio || undefined,
  createdAt: user.created_at || new Date().toISOString(),
});

// Helper to map our User type to Supabase format
const mapToSupabaseUser = (user: Partial<User>) => ({
  login_name: user.loginName,
  display_name: user.displayName,
  is_admin: user.isAdmin,
  is_locked: user.isLocked,
  profile_picture: user.profilePicture,
  bio: user.bio,
});

export const supabaseService = {
  // Auth
  login: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    if (!data.user) throw new Error('Login failed');

    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      // If profile doesn't exist, create one
      const newProfile = {
        id: data.user.id,
        login_name: email.split('@')[0],
        display_name: data.user.user_metadata?.display_name || email.split('@')[0],
        is_admin: false,
        is_locked: false,
        created_at: new Date().toISOString(),
      };

      const { data: insertedProfile, error: insertError } = await supabase
        .from(TABLES.USERS)
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create user profile:', insertError);
        // If insert fails, try to return a basic user object from auth data
        // This allows login to proceed even if profile creation fails
        return {
          id: data.user.id,
          loginName: email.split('@')[0],
          displayName: data.user.user_metadata?.display_name || email.split('@')[0],
          passwordHash: '',
          isAdmin: false,
          isLocked: false,
          createdAt: new Date().toISOString(),
        };
      }

      return mapSupabaseUser({ ...insertedProfile, email });
    }

    return mapSupabaseUser({ ...profile, email });
  },

  register: async (email: string, displayName: string, password: string): Promise<User> => {
    // Sign up with Supabase Auth first
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed');

    // Try to create user profile in users table
    const newProfile = {
      id: data.user.id,
      login_name: email.split('@')[0],
      display_name: displayName,
      is_admin: false,
      is_locked: false,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from(TABLES.USERS)
      .insert(newProfile);

    if (insertError) {
      console.warn('Profile creation failed (may be created by trigger):', insertError.message);
      // Don't throw - the trigger might create it, or we'll create on first login
    }

    // Return user object regardless
    return {
      id: data.user.id,
      loginName: email.split('@')[0],
      displayName: displayName,
      passwordHash: '',
      isAdmin: false,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) return null;

    return mapSupabaseUser({ ...profile, email: user.email });
  },

  getUserById: async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapSupabaseUser(data);
  },

  updateUserProfile: async (userId: string, updates: { displayName?: string; bio?: string }): Promise<User> => {
    const updateData: any = {};
    if (updates.displayName) updateData.display_name = updates.displayName;
    if (updates.bio !== undefined) updateData.bio = updates.bio;

    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('User not found');

    // Update denormalized ownerName in decks
    if (updates.displayName) {
      await supabase
        .from(TABLES.DECKS)
        .update({ owner_name: updates.displayName })
        .eq('owner_id', userId);
    }

    return mapSupabaseUser(data);
  },

  // Decks
  getDecks: async (userId?: string, publicOnly = false, search?: string): Promise<Deck[]> => {
    let query = supabase.from(TABLES.DECKS).select('*, cards(count)');

    if (userId) {
      query = query.eq('owner_id', userId);
    } else if (publicOnly) {
      query = query.eq('is_public', true);
    }

    query = query.eq('is_hidden_by_admin', false);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      ownerId: d.owner_id,
      ownerName: d.owner_name,
      title: d.title,
      description: d.description || '',
      isPublic: d.is_public,
      isHiddenByAdmin: d.is_hidden_by_admin,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      tags: d.tags || [],
      cardCount: d.cards?.[0]?.count || 0,
      averageRating: d.average_rating || 0,
      ratingCount: d.rating_count || 0,
      lastSeen: d.last_seen,
    }));
  },

  getDeckById: async (id: string): Promise<Deck | null> => {
    const { data, error } = await supabase
      .from(TABLES.DECKS)
      .select('*, cards(count)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      ownerId: data.owner_id,
      ownerName: data.owner_name,
      title: data.title,
      description: data.description || '',
      isPublic: data.is_public,
      isHiddenByAdmin: data.is_hidden_by_admin,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      tags: data.tags || [],
      cardCount: data.cards?.[0]?.count || 0,
      averageRating: data.average_rating || 0,
      ratingCount: data.rating_count || 0,
      lastSeen: data.last_seen,
    };
  },

  createDeck: async (deckData: Partial<Deck>): Promise<Deck> => {
    const newDeck = {
      owner_id: deckData.ownerId!,
      owner_name: deckData.ownerName!,
      title: deckData.title!,
      description: deckData.description || '',
      is_public: false,
      is_hidden_by_admin: false,
      tags: deckData.tags || [],
      card_count: 0,
      average_rating: 0,
      rating_count: 0,
    };

    const { data, error } = await supabase
      .from(TABLES.DECKS)
      .insert(newDeck)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Failed to create deck');

    return {
      id: data.id,
      ownerId: data.owner_id,
      ownerName: data.owner_name,
      title: data.title,
      description: data.description || '',
      isPublic: data.is_public,
      isHiddenByAdmin: data.is_hidden_by_admin,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      tags: data.tags || [],
      cardCount: data.card_count || 0,
      averageRating: data.average_rating || 0,
      ratingCount: data.rating_count || 0,
    };
  },

  updateDeck: async (id: string, updates: Partial<Deck>): Promise<Deck> => {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.cardCount !== undefined) updateData.card_count = updates.cardCount;
    if (updates.averageRating !== undefined) updateData.average_rating = updates.averageRating;
    if (updates.ratingCount !== undefined) updateData.rating_count = updates.ratingCount;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(TABLES.DECKS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Deck not found');

    return {
      id: data.id,
      ownerId: data.owner_id,
      ownerName: data.owner_name,
      title: data.title,
      description: data.description || '',
      isPublic: data.is_public,
      isHiddenByAdmin: data.is_hidden_by_admin,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      tags: data.tags || [],
      cardCount: data.card_count || 0,
      averageRating: data.average_rating || 0,
      ratingCount: data.rating_count || 0,
    };
  },

  deleteDeck: async (id: string): Promise<void> => {
    // Delete cards first (cascade)
    await supabase.from(TABLES.CARDS).delete().eq('deck_id', id);
    
    // Delete deck
    const { error } = await supabase.from(TABLES.DECKS).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  cloneDeck: async (originalDeckId: string, newOwnerId: string, newOwnerName: string): Promise<Deck> => {
    const originalDeck = await supabaseService.getDeckById(originalDeckId);
    if (!originalDeck) throw new Error('Deck not found');

    const newDeck = await supabaseService.createDeck({
      ownerId: newOwnerId,
      ownerName: newOwnerName,
      title: `${originalDeck.title} (Copy)`,
      description: originalDeck.description,
      tags: originalDeck.tags,
    });

    const cards = await supabaseService.getCards(originalDeckId);
    const newCards = cards.map(c => ({
      deck_id: newDeck.id,
      front: c.front,
      back: c.back,
    }));

    if (newCards.length > 0) {
      const { error } = await supabase.from(TABLES.CARDS).insert(newCards);
      if (error) throw new Error(error.message);
    }

    return newDeck;
  },

  // Cards
  getCards: async (deckId: string): Promise<Card[]> => {
    const { data, error } = await supabase
      .from(TABLES.CARDS)
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    if (!data) return [];

    return data.map((c: any) => ({
      id: c.id,
      deckId: c.deck_id,
      front: c.front,
      back: c.back,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  },

  createCard: async (cardData: Partial<Card>): Promise<Card> => {
    const newCard = {
      deck_id: cardData.deckId!,
      front: cardData.front!,
      back: cardData.back!,
    };

    const { data, error } = await supabase
      .from(TABLES.CARDS)
      .insert(newCard)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Failed to create card');

    return {
      id: data.id,
      deckId: data.deck_id,
      front: data.front,
      back: data.back,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  updateCard: async (id: string, updates: Partial<Card>): Promise<Card> => {
    const updateData: any = {};
    if (updates.front !== undefined) updateData.front = updates.front;
    if (updates.back !== undefined) updateData.back = updates.back;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(TABLES.CARDS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Card not found');

    return {
      id: data.id,
      deckId: data.deck_id,
      front: data.front,
      back: data.back,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  deleteCard: async (id: string, deckId: string): Promise<void> => {
    const { error } = await supabase.from(TABLES.CARDS).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Comments
  getComments: async (deckId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from(TABLES.COMMENTS)
      .select('*')
      .eq('deck_id', deckId)
      .eq('is_hidden_by_admin', false)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!data) return [];

    return data.map((c: any) => ({
      id: c.id,
      deckId: c.deck_id,
      userId: c.user_id,
      userName: c.user_name,
      content: c.content,
      createdAt: c.created_at,
      isHiddenByAdmin: c.is_hidden_by_admin,
    }));
  },

  postComment: async (deckId: string, userId: string, userName: string, content: string): Promise<Comment> => {
    const newComment = {
      deck_id: deckId,
      user_id: userId,
      user_name: userName,
      content,
      is_hidden_by_admin: false,
    };

    const { data, error } = await supabase
      .from(TABLES.COMMENTS)
      .insert(newComment)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Failed to create comment');

    return {
      id: data.id,
      deckId: data.deck_id,
      userId: data.user_id,
      userName: data.user_name,
      content: data.content,
      createdAt: data.created_at,
      isHiddenByAdmin: data.is_hidden_by_admin,
    };
  },

  // Ratings
  rateDeck: async (deckId: string, userId: string, value: number): Promise<void> => {
    // Check if rating exists
    const { data: existing } = await supabase
      .from(TABLES.RATINGS)
      .select('*')
      .eq('deck_id', deckId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing rating
      const { error } = await supabase
        .from(TABLES.RATINGS)
        .update({ value })
        .eq('deck_id', deckId)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
    } else {
      // Insert new rating
      const { error } = await supabase
        .from(TABLES.RATINGS)
        .insert({ deck_id: deckId, user_id: userId, value });
      if (error) throw new Error(error.message);
    }

    // Calculate and update deck stats
    const { data: ratings } = await supabase
      .from(TABLES.RATINGS)
      .select('value')
      .eq('deck_id', deckId);

    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((acc, curr) => acc + curr.value, 0) / ratings.length;
      await supabaseService.updateDeck(deckId, {
        averageRating: parseFloat(avg.toFixed(1)),
        ratingCount: ratings.length,
      });
    }
  },

  getUserRating: async (deckId: string, userId: string): Promise<number> => {
    const { data, error } = await supabase
      .from(TABLES.RATINGS)
      .select('value')
      .eq('deck_id', deckId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return 0;
    return data.value;
  },

  // Admin
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!data) return [];

    return data.map(mapSupabaseUser);
  },

  updateUserLock: async (userId: string, isLocked: boolean): Promise<void> => {
    const { error } = await supabase
      .from(TABLES.USERS)
      .update({ is_locked: isLocked })
      .eq('id', userId);

    if (error) throw new Error(error.message);
  },

  sendWarning: async (userId: string, adminId: string, reason: string): Promise<Warning> => {
    const newWarning = {
      user_id: userId,
      admin_id: adminId,
      reason,
      is_dismissed: false,
    };

    const { data, error } = await supabase
      .from(TABLES.WARNINGS)
      .insert(newWarning)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Failed to create warning');

    return {
      id: data.id,
      userId: data.user_id,
      adminId: data.admin_id,
      reason: data.reason,
      isDismissed: data.is_dismissed,
      createdAt: data.created_at,
    };
  },

  getWarnings: async (userId: string): Promise<Warning[]> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.WARNINGS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch warnings:', error.message);
        return []; // Return empty instead of throwing
      }
      if (!data) return [];

      return data.map((w: any) => ({
        id: w.id,
        userId: w.user_id,
        adminId: w.admin_id,
        reason: w.reason,
        isDismissed: w.is_dismissed,
        createdAt: w.created_at,
      }));
    } catch (err) {
      console.warn('Warning fetch failed:', err);
      return []; // Fail silently
    }
  },

  dismissWarning: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from(TABLES.WARNINGS)
        .update({ is_dismissed: true })
        .eq('id', id);

      if (error) {
        console.warn('Could not dismiss warning:', error.message);
      }
    } catch (err) {
      console.warn('Dismiss warning failed:', err);
    }
  },
};
