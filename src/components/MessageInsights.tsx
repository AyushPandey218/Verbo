
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Message } from '@/utils/messageUtils';
import { formatTimestamp } from '@/utils/messageUtils';
import { ChevronDown, Map, Tag } from 'lucide-react';

// Define categories since the import is missing
const CATEGORIES = [
  "General",
  "Question",
  "Personal",
  "Professional",
  "Technical",
  "Emotional",
  "Greeting"
];

interface MessageInsightsProps {
  message: string;
  sentiment?: number;
  messageCategories?: string[];
}

const MessageInsights: React.FC<MessageInsightsProps> = ({ message, sentiment = 0, messageCategories = [] }) => {
  return (
    <div className="p-2 space-y-2 text-xs">
      <div className="flex items-center gap-1">
        <Tag size={14} className="text-indigo-500" />
        <span className="text-muted-foreground">Categories:</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {messageCategories.map((category, index) => (
          <Badge 
            key={`category-${index}`} 
            className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
          >
            {category}
          </Badge>
        ))}
        {messageCategories.length === 0 && (
          <Badge>
            General
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Map size={14} className="text-indigo-500" />
        <span className="text-muted-foreground">Sentiment:</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${
              sentiment > 0.2 ? 'bg-emerald-500' : 
              sentiment < -0.2 ? 'bg-rose-500' : 
              'bg-amber-500'
            }`}
            style={{ width: `${(sentiment + 1) * 50}%` }}
          />
        </div>
        <span className="font-mono">
          {sentiment.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default MessageInsights;
