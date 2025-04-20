export type MessageCategory = 'General' | 'Question' | 'Greeting' | 'Request' | 'Response' | 'Media';

export function categorizeMessage(message: string): MessageCategory {
  if (!message) return 'General';
  
  // Check if this is a GIF message
  if (message.startsWith('[GIF](') && message.endsWith(')')) {
    return 'Media';
  }
  
  const lowerMessage = message.toLowerCase();
  
  // Check for questions
  if (message.includes('?')) {
    return 'Question';
  }
  
  // Check for greetings
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'welcome', 'greetings'];
  for (const greeting of greetings) {
    if (lowerMessage.includes(greeting)) {
      return 'Greeting';
    }
  }
  
  // Check for requests
  const requestPhrases = ['can you', 'could you', 'please', 'would you', 'help me', 'how to', 'need to'];
  for (const phrase of requestPhrases) {
    if (lowerMessage.includes(phrase)) {
      return 'Request';
    }
  }
  
  // Check for responses
  const responsePhrases = ['thank', 'thanks', 'got it', 'okay', 'ok', 'sure', 'yes', 'no', 'alright'];
  for (const phrase of responsePhrases) {
    if (lowerMessage.includes(phrase)) {
      return 'Response';
    }
  }
  
  return 'General';
}

// Helper function to check if a message contains a GIF
export function isGifMessage(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  return message.startsWith('[GIF](') && message.endsWith(')');
}

// Helper function to extract GIF URL from a message
export function extractGifUrl(message: string): string | null {
  if (isGifMessage(message)) {
    try {
      // Extract URL between [GIF]( and )
      return message.substring(5, message.length - 1);
    } catch (error) {
      console.error("Error extracting GIF URL:", error);
      return null;
    }
  }
  return null;
}


