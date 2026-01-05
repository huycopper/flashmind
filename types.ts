export interface User {
  id: string;
  loginName: string;
  displayName: string;
  passwordHash: string; // In mock, we store plain text or simple mock hash
  isAdmin: boolean;
  isLocked: boolean;
  profilePicture?: string;
  bio?: string;
}

export interface Deck {
  id: string;
  ownerId: string;
  ownerName: string; // Denormalized for easy display
  title: string;
  description: string;
  isPublic: boolean;
  isHiddenByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  cardCount: number;
  averageRating: number;
  ratingCount: number;
  lastSeen?: string; // Personal user metadata for study
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  deckId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  isHiddenByAdmin: boolean;
}

export interface Rating {
  deckId: string;
  userId: string;
  value: number; // 1-5
}

export interface Warning {
  id: string;
  userId: string;
  adminId: string;
  reason: string;
  isDismissed: boolean;
  createdAt: string;
}

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
};