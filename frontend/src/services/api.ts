// Frontend API Service client

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5148/api';

export interface SynonymPair {
  word1: string;
  word2: string;
}

export interface GraphNode {
  id: string;
  group: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface AnalyzeResponse {
  wordSynonyms: Record<string, string[]>;
}

export const api = {
  /**
   * Add a manual synonym pair (A is synonym to B)
   */
  async addSynonymPair(word1: string, word2: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/synonyms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word1, word2 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add synonym pair.');
    }

    return response.json();
  },

  /**
   * Get all direct and transitive synonyms for a single word
   */
  async getSynonyms(word: string): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/synonyms/${encodeURIComponent(word)}`);
    if (!response.ok) {
      throw new Error('Failed to retrieve synonyms.');
    }
    return response.json();
  },

  /**
   * Analyze a sentence to find synonyms for each word (live analyzer)
   */
  async analyzeSentence(sentence: string): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/synonyms/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze sentence.');
    }

    return response.json();
  },

  /**
   * Fetch the complete synonym graph (nodes and links)
   */
  async getGraph(): Promise<GraphResponse> {
    const response = await fetch(`${API_BASE_URL}/synonyms/graph`);
    if (!response.ok) {
      throw new Error('Failed to fetch synonym graph.');
    }
    return response.json();
  },

  /**
   * Fetch & Seed synonyms from the Datamuse API (targets >= 1000 words)
   */
  async seedExternal(): Promise<{ message: string; totalWords: number }> {
    const response = await fetch(`${API_BASE_URL}/synonyms/seed-external`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to seed from external API.');
    }

    return response.json();
  },
};
