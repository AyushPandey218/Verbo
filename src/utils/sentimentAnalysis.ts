
// Update the import to use the types we just defined
import { SentimentResult, SentimentScore } from '../types/ChatInterface';
import Sentiment from 'sentiment';

// Rename the interface to avoid conflicts with imported types
export interface SentimentScoreData {
  score: number;
  comparative: number;
  positive: string[];
  negative: string[];
}

const sentiment = new Sentiment();

export const analyzeSentiment = (text: string): SentimentScore => {
  const result = sentiment.analyze(text);
  
  // Determine sentiment score based on the analysis
  if (result.score > 2) return 'positive';
  if (result.score < 0) return 'negative';
  return 'neutral';
};

export const getSentimentEmoji = (sentiment: SentimentScore): string => {
  switch (sentiment) {
    case 'positive': return '😊';
    case 'negative': return '😠';
    default: return '😐';
  }
};
