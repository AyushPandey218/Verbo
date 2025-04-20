export type MessageCategory = 'General' | 'Question' | 'Greeting' | 'Request' | 'Response';

export function categorizeMessage(message: string): MessageCategory {
  if (!message) return 'General';
  
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
