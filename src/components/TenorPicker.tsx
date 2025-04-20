import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TENOR_API_KEY, TENOR_API_URL } from '@/utils/config';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface TenorPickerProps {
  onSelect: (gifUrl: string) => void;
}

const TenorPicker: React.FC<TenorPickerProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchGifs = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const searchEndpoint = `${TENOR_API_URL}/search?q=${encodeURIComponent(term)}&key=${TENOR_API_KEY}&client_key=verbo_chat&limit=20`;
      const response = await fetch(searchEndpoint);
      const data = await response.json();
      setGifs(data.results || []);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFeaturedGifs = useCallback(async () => {
    setLoading(true);
    try {
      const featuredEndpoint = `${TENOR_API_URL}/featured?key=${TENOR_API_KEY}&client_key=verbo_chat&limit=20`;
      const response = await fetch(featuredEndpoint);
      const data = await response.json();
      setGifs(data.results || []);
    } catch (error) {
      console.error('Error fetching featured GIFs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      getFeaturedGifs();
    }
  }, [isOpen, getFeaturedGifs]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm) {
        searchGifs(searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, searchGifs]);

  const handleSelectGif = (gif: any) => {
    const gifUrl = gif.media_formats.gif.url;
    onSelect(gifUrl);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-10 w-10 bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
            <path d="M7 3v6"/>
            <path d="M17 3v6"/>
            <path d="M21 9V7a2 2 0 0 0-2-2h-4"/>
            <path d="M3 9V7a2 2 0 0 1 2-2h4"/>
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-2 border-b">
          <Input
            placeholder="Search GIFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelectGif(gif)}
                  className="aspect-video rounded overflow-hidden hover:opacity-90 transition-opacity"
                >
                  <img
                    src={gif.media_formats.tinygif.url}
                    alt={gif.content_description}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
export default TenorPicker;
