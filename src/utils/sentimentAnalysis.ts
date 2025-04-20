
export type SentimentScore = 'positive' | 'neutral' | 'negative';

export function analyzeSentiment(message: string): SentimentScore {
  const positiveWords = ['good', 'great', 'awesome', 'excellent', 'happy', 'love', 'wonderful', 'thanks', 'thank', 'nice', 'cool'];
  const negativeWords = [
    'bad', 'terrible', 'awful', 'sad', 'angry', 'hate', 'worst',
    // Common swear words and variations
    'fuck', 'shit', 'damn', 'ass', 'bitch', 'crap', 'hell',
    'wtf', 'stfu', 'fk', 'fck', 'fuk', 'sht', 'bs'
  ];
  const greetingWords = ['hello', 'hi', 'hey', 'greetings', 'howdy', 'hola'];
  
  const lowercaseMessage = message.toLowerCase();
  const words = lowercaseMessage.split(/\s+/);
  
  // Check if the message is just a greeting
  if (words.length <= 2 && words.some(word => greetingWords.includes(word))) {
    return 'neutral';
  }
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    // Check for swear words first
    if (negativeWords.some(neg => word.includes(neg))) {
      negativeCount += 2; // Give more weight to swear words
      return;
    }
    
    if (positiveWords.some(pos => word.includes(pos))) {
      positiveCount++;
    }
  });
  
  if (negativeCount > 0) return 'negative'; // Any swear word makes it negative
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

export function getSentimentEmoji(sentiment: SentimentScore): string {
  switch (sentiment) {
    case 'positive': return '😊';
    case 'negative': return '😠';
    default: return '😐';
  }
}
