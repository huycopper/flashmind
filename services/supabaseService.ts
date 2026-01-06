import { supabase } from './supabaseClient';
import { User, Deck, Card, Comment, Warning } from '../types';

// Database table names
const TABLES = {
  USERS: 'users',
  DECKS: 'decks',
  CARDS: 'cards',
  COMMENTS: 'comments',
  RATINGS: 'ratings',
  WARNINGS: 'warnings',
};

class FlashMindService {
  private client = supabase;

  // --- Mappers ---

  private mapUser(user: any): User {
    return {
      id: user.id,
      loginName: user.login_name || user.email?.split('@')[0] || '',
      displayName: user.display_name || user.email?.split('@')[0] || '',
      passwordHash: '',
      isAdmin: user.is_admin || false,
      isLocked: user.is_locked || false,
      profilePicture: user.profile_picture || undefined,
      bio: user.bio || undefined,
      createdAt: user.created_at || new Date().toISOString(),
    };
  }

  private mapDeck(d: any): Deck {
    return {
      id: d.id,
      ownerId: d.owner_id,
      ownerName: d.owner_name || d.users?.display_name || 'Unknown',
      title: d.title,
      description: d.description || '',
      isPublic: d.is_public,
      isHiddenByAdmin: d.is_hidden_by_admin,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      tags: d.tags || [],
      cardCount: d.cards?.[0]?.count || d.card_count || 0,
      averageRating: d.average_rating || 0,
      ratingCount: d.rating_count || 0,
      lastSeen: d.last_seen,
    };
  }

  private mapCard(c: any): Card {
    return {
      id: c.id,
      deckId: c.deck_id,
      front: c.front,
      back: c.back,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  }

  // --- Auth ---

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed');

    // Get or create profile
    let { data: profile } = await this.client
      .from(TABLES.USERS)
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      // Create profile if missing
      const newProfile = {
        id: data.user.id,
        login_name: email.split('@')[0],
        display_name: data.user.user_metadata?.display_name || email.split('@')[0],
        is_admin: false,
        is_locked: false,
        created_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await this.client
        .from(TABLES.USERS)
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        // Fallback if DB insert fails but Auth succeeded
        return {
          id: data.user.id,
          loginName: email.split('@')[0],
          displayName: email.split('@')[0],
          passwordHash: '',
          isAdmin: false,
          isLocked: false,
          createdAt: new Date().toISOString()
        };
      }
      profile = inserted;
    }

    if (profile.is_locked) {
      await this.client.auth.signOut();
      throw new Error('Your account has been locked. Please contact support.');
    }

    return this.mapUser({ ...profile, email });
  }

  async register(email: string, displayName: string, password: string): Promise<User> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed');

    // Profile creation is typically handled by trigger, but we handle manual insert in login if needed.
    // Here we return a preliminary user object.
    return {
      id: data.user.id,
      loginName: email.split('@')[0],
      displayName: displayName,
      passwordHash: '',
      isAdmin: false,
      isLocked: false,
      createdAt: new Date().toISOString()
    };
  }

  async logout(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.client.auth.getUser();
    if (!user) return null;

    const { data: profile } = await this.client
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return null;
    return this.mapUser(profile);
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from(TABLES.USERS)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapUser(data);
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await this.client.from(TABLES.USERS).select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(this.mapUser);
  }

  async updateUserProfile(userId: string, updates: { displayName?: string; bio?: string }): Promise<User> {
    const updateData: any = {};
    if (updates.displayName) updateData.display_name = updates.displayName;
    if (updates.bio !== undefined) updateData.bio = updates.bio;

    const { data, error } = await this.client
      .from(TABLES.USERS)
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update denormalized ownerName
    if (updates.displayName) {
      await this.client.from(TABLES.DECKS).update({ owner_name: updates.displayName }).eq('owner_id', userId);
    }
    return this.mapUser(data);
  }

  async updateUserLock(userId: string, isLocked: boolean): Promise<void> {
    const { error } = await this.client.from(TABLES.USERS).update({ is_locked: isLocked }).eq('id', userId);
    if (error) throw new Error(error.message);
  }

  // --- Decks ---

  async getDecks(userId?: string, publicOnly = false, search?: string, includeHidden = false): Promise<Deck[]> {
    let query = this.client.from(TABLES.DECKS).select('*, cards(count), users:owner_id(display_name)');

    if (userId) query = query.eq('owner_id', userId);
    else if (publicOnly) query = query.eq('is_public', true);

    if (!includeHidden) query = query.eq('is_hidden_by_admin', false);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    return (data || []).map((d: any) => this.mapDeck(d));
  }

  async getDeckById(id: string): Promise<Deck | null> {
    const { data, error } = await this.client
      .from(TABLES.DECKS)
      .select('*, cards(count), users:owner_id(display_name)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapDeck(data);
  }

  async getAllDecksAdmin(): Promise<Deck[]> {
    // Reuse getDecks but include hidden
    return this.getDecks(undefined, false, undefined, true);
  }

  async createDeck(deck: Partial<Deck>): Promise<Deck> {
    const { data, error } = await this.client
      .from(TABLES.DECKS)
      .insert({
        owner_id: deck.ownerId,
        owner_name: deck.ownerName,
        title: deck.title,
        description: deck.description || '',
        is_public: false, // Default private
        is_hidden_by_admin: false
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapDeck(data);
  }

  async updateDeck(id: string, updates: Partial<Deck>): Promise<Deck> {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
    if (updates.isHiddenByAdmin !== undefined) dbUpdates.is_hidden_by_admin = updates.isHiddenByAdmin;
    if (updates.averageRating !== undefined) dbUpdates.average_rating = updates.averageRating;
    if (updates.ratingCount !== undefined) dbUpdates.rating_count = updates.ratingCount;

    const { data, error } = await this.client
      .from(TABLES.DECKS)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapDeck(data);
  }

  async deleteDeck(id: string): Promise<void> {
    await this.client.from(TABLES.CARDS).delete().eq('deck_id', id);
    const { error } = await this.client.from(TABLES.DECKS).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async cloneDeck(originalDeckId: string, newOwnerId: string, newOwnerName: string): Promise<Deck> {
    const original = await this.getDeckById(originalDeckId);
    if (!original) throw new Error('Deck not found');

    // Create Deck Copy
    const newDeck = await this.createDeck({
      ownerId: newOwnerId,
      ownerName: newOwnerName,
      title: `${original.title} (Copy)`,
      description: original.description
    });

    // Copy Cards
    const cards = await this.getCards(originalDeckId);
    if (cards.length > 0) {
      const newCards = cards.map(c => ({
        deck_id: newDeck.id,
        front: c.front,
        back: c.back
      }));
      const { error } = await this.client.from(TABLES.CARDS).insert(newCards);
      if (error) throw new Error(error.message);
    }
    return newDeck;
  }

  // --- Cards ---

  async getCards(deckId: string): Promise<Card[]> {
    const { data, error } = await this.client
      .from(TABLES.CARDS)
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map(this.mapCard);
  }

  async createCard(card: Partial<Card>): Promise<Card> {
    const { data, error } = await this.client
      .from(TABLES.CARDS)
      .insert({
        deck_id: card.deckId,
        front: card.front,
        back: card.back
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapCard(data);
  }

  async updateCard(id: string, updates: Partial<Card>): Promise<Card> {
    const { data, error } = await this.client
      .from(TABLES.CARDS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapCard(data);
  }

  async deleteCard(id: string): Promise<void> {
    const { error } = await this.client.from(TABLES.CARDS).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  // --- Comments ---

  async getComments(deckId: string): Promise<Comment[]> {
    const { data, error } = await this.client
      .from(TABLES.COMMENTS)
      .select('*')
      .eq('deck_id', deckId)
      .eq('is_hidden_by_admin', false)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((c: any) => ({
      id: c.id,
      deckId: c.deck_id,
      userId: c.user_id,
      userName: c.user_name,
      content: c.content,
      createdAt: c.created_at,
      isHiddenByAdmin: c.is_hidden_by_admin,
    }));
  }

  async postComment(deckId: string, userId: string, userName: string, content: string): Promise<Comment> {
    const { data, error } = await this.client
      .from(TABLES.COMMENTS)
      .insert({
        deck_id: deckId,
        user_id: userId,
        user_name: userName,
        content,
        is_hidden_by_admin: false
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      deckId: data.deck_id,
      userId: data.user_id,
      userName: data.user_name,
      content: data.content,
      createdAt: data.created_at,
      isHiddenByAdmin: data.is_hidden_by_admin
    };
  }

  async getAllCommentsAdmin(): Promise<Comment[]> {
    const { data, error } = await this.client
      .from(TABLES.COMMENTS)
      .select('*, decks(title)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((c: any) => ({
      id: c.id,
      deckId: c.deck_id,
      deckTitle: c.decks?.title || 'Unknown Deck',
      userId: c.user_id,
      userName: c.user_name,
      content: c.content,
      createdAt: c.created_at,
      isHiddenByAdmin: c.is_hidden_by_admin,
    }));
  }

  async toggleCommentVisibility(id: string, isHidden: boolean): Promise<void> {
    const { error } = await this.client.from(TABLES.COMMENTS).update({ is_hidden_by_admin: isHidden }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteComment(id: string): Promise<void> {
    const { error } = await this.client.from(TABLES.COMMENTS).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  // --- Ratings ---

  async rateDeck(deckId: string, userId: string, value: number): Promise<void> {
    const { data: existing } = await this.client
      .from(TABLES.RATINGS)
      .select('id')
      .eq('deck_id', deckId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await this.client.from(TABLES.RATINGS).update({ value }).eq('id', existing.id);
    } else {
      await this.client.from(TABLES.RATINGS).insert({ deck_id: deckId, user_id: userId, value });
    }

    // Update Averages
    const { data: ratings } = await this.client.from(TABLES.RATINGS).select('value').eq('deck_id', deckId);
    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((a, b) => a + b.value, 0) / ratings.length;
      await this.updateDeck(deckId, { averageRating: parseFloat(avg.toFixed(1)), ratingCount: ratings.length });
    }
  }

  async getUserRating(deckId: string, userId: string): Promise<number> {
    const { data } = await this.client
      .from(TABLES.RATINGS)
      .select('value')
      .eq('deck_id', deckId)
      .eq('user_id', userId)
      .single();
    return data?.value || 0;
  }

  // --- Admin Warnings ---

  async sendWarning(userId: string, adminId: string, reason: string): Promise<Warning> {
    const { data, error } = await this.client
      .from(TABLES.WARNINGS)
      .insert({ user_id: userId, admin_id: adminId, reason, is_dismissed: false })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      userId: data.user_id,
      adminId: data.admin_id,
      reason: data.reason,
      isDismissed: data.is_dismissed,
      createdAt: data.created_at
    };
  }

  async getWarnings(userId: string): Promise<Warning[]> {
    const { data, error } = await this.client
      .from(TABLES.WARNINGS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map((w: any) => ({
      id: w.id,
      userId: w.user_id,
      adminId: w.admin_id,
      reason: w.reason,
      isDismissed: w.is_dismissed,
      createdAt: w.created_at
    }));
  }

  async dismissWarning(id: string): Promise<void> {
    await this.client.from(TABLES.WARNINGS).update({ is_dismissed: true }).eq('id', id);
  }
}

export const supabaseService = new FlashMindService();
