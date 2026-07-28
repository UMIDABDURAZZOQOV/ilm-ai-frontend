import { apiFetch } from "./api";

export interface DeckSummary {
  id: number;
  title: string;
  total: number;
  due: number;
}

export interface DueCard {
  index: number;
  front: string;
  back: string;
}

export async function createDeck(userId: number, title: string, cards: { front: string; back: string }[]): Promise<{ id: number; title: string; total: number }> {
  return apiFetch("/decks", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, title, cards }),
  });
}

export async function listDecks(userId: number): Promise<{ decks: DeckSummary[] }> {
  return apiFetch(`/decks/${userId}`);
}

export async function getDueCards(userId: number, deckId: number): Promise<{ title: string; cards: DueCard[]; total: number }> {
  return apiFetch(`/decks/${userId}/${deckId}`);
}

export async function reviewDeck(userId: number, deckId: number, results: { index: number; correct: boolean }[]): Promise<{ ok: boolean; due: number }> {
  return apiFetch("/decks/review", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, deck_id: deckId, results }),
  });
}

export async function deleteDeck(userId: number, deckId: number): Promise<{ ok: boolean }> {
  return apiFetch(`/decks/${userId}/${deckId}`, { method: "DELETE" });
}
