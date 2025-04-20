
export const MESSAGE_CATEGORIES = [
  'General', 
  'Question', 
  'Personal', 
  'Professional', 
  'Technical', 
  'Emotional',
  'Greeting',
  'Profanity'
] as const;

export type MessageCategory = typeof MESSAGE_CATEGORIES[number];

export function categorizeMessage(message: string): MessageCategory {
  const lowercaseMessage = message.toLowerCase();
  
  // Check for profanity/swear words
  if (/\b(fuck|shit|damn|ass|bitch|crap|hell|wtf|fk|fck|fuk|sht|bs)\b/.test(lowercaseMessage)) {
    return 'Profanity';
  }
  
  // Check for greetings first
  if (/\b(hello|hi|hey|greetings|howdy|hola|good morning|good afternoon|good evening)\b/.test(lowercaseMessage) && message.length < 30) {
    return 'Greeting';
  }
  
  if (/\?/.test(lowercaseMessage)) return 'Question';
  if (/work|job|project|meeting/.test(lowercaseMessage)) return 'Professional';
  if (/code|tech|programming|algorithm/.test(lowercaseMessage)) return 'Technical';
  if (/feeling|emotion|how are you/.test(lowercaseMessage)) return 'Emotional';
  
  return 'General';
}
