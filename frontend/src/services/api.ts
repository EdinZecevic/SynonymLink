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

export interface DeletePreviewResponse {
  targetWord: string;
  firstConnections: string[];
  secondConnections: string[];
}

/**
 * Returns common request headers, appending X-User-Id from localStorage if present
 */
function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const userId = localStorage.getItem('synonym_link_uuid');
  if (userId) {
    headers['X-User-Id'] = userId;
  }
  return headers;
}

export const api = {
  /**
   * Add a manual synonym pair (A is synonym to B)
   */
  async addSynonymPair(word1: string, word2: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/synonyms`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
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
  async getSynonyms(word: string, directOnly?: boolean): Promise<string[]> {
    const url = `${API_BASE_URL}/synonyms/${encodeURIComponent(word)}${directOnly ? '?directOnly=true' : ''}`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
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
      headers: getHeaders({ 'Content-Type': 'application/json' }),
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
    const response = await fetch(`${API_BASE_URL}/synonyms/graph`, {
      headers: getHeaders(),
    });
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
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to seed from external API.');
    }

    return response.json();
  },

  /**
   * Get preview of what will be deleted
   */
  async getDeletePreview(word: string): Promise<DeletePreviewResponse> {
    const response = await fetch(`${API_BASE_URL}/synonyms/${encodeURIComponent(word)}/delete-preview`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch delete preview.');
    }
    return response.json();
  },

  /**
   * Delete a word and its connections based on mode (single or cascade)
   */
  async deleteWord(word: string, mode: 'single' | 'cascade'): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/synonyms/${encodeURIComponent(word)}?mode=${mode}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete word.');
    }
    return response.json();
  },

  /**
   * Rename a word while preserving its connections
   */
  async renameWord(oldWord: string, newWord: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/synonyms/${encodeURIComponent(oldWord)}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ newWord }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to rename word.');
    }

    return response.json();
  },

  /**
   * Delete synonym connection between two words
   */
  async deleteRelationship(word1: string, word2: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/synonyms/relationship?word1=${encodeURIComponent(word1)}&word2=${encodeURIComponent(word2)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete synonym connection.');
    }

    return response.json();
  },
};

