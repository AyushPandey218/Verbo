
import React from 'react';
import { analyzeSentiment, getSentimentEmoji } from '@/utils/sentimentAnalysis';
import { categorizeMessage } from '@/utils/messageCategories';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface MessageInsightsProps {
  message: string;
}

const MessageInsights: React.FC<MessageInsightsProps> = ({ message }) => {
  const sentiment = analyzeSentiment(message);
  const category = categorizeMessage(message);
  
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="flex items-center gap-1">
        <Info size={12} />
        {getSentimentEmoji(sentiment)} {sentiment} 
      </Badge>
      <Badge variant="secondary">
        {category}
      </Badge>
    </div>
  );
};

export default MessageInsights;
