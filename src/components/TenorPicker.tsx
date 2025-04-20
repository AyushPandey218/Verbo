import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GifIcon } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);

  const searchGifs = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchEndpoint = `${TENOR_API_URL}/search?q=${encodeURIComponent(term)}&key=${TENOR_API_KEY}&client_key=verbo_chat&limit=20`;
      console.log('Searching GIFs with endpoint:', searchEndpoint);
      
      const response = await fetch(searchEndpoint);
      
      if (!response.ok) {
        throw new Error(`Tenor API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Tenor search response:', data);
      
      if (data.results && Array.isArray(data.results)) {
        setGifs(data.results);
      } else {
        console.error('Invalid Tenor API response format:', data);
        setError('Invalid response from Tenor API');
        setGifs([]);
      }
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setError('Failed to fetch GIFs. Please try again.');
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFeaturedGifs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const featuredEndpoint = `${TENOR_API_URL}/featured?key=${TENOR_API_KEY}&client_key=verbo_chat&limit=20`;
      console.log('Fetching featured GIFs with endpoint:', featuredEndpoint);
      
      const response = await fetch(featuredEndpoint);
      
      if (!response.ok) {
        throw new Error(`Tenor API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Tenor featured response:', data);
      
      if (data.results && Array.isArray(data.results)) {
        setGifs(data.results);
      } else {
        console.error('Invalid Tenor API response format:', data);
        setError('Invalid response from Tenor API');
        setGifs([]);
      }
    } catch (error) {
      console.error('Error fetching featured GIFs:', error);
      setError('Failed to fetch GIFs. Please try again.');
      setGifs([]);
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
      if (searchTerm && isOpen) {
        searchGifs(searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, searchGifs, isOpen]);

  const handleSelectGif = (gif: any) => {
    // Check if gif has the required format
    if (!gif.media_formats || !gif.media_formats.gif || !gif.media_formats.gif.url) {
      console.error('Invalid GIF format:', gif);
      return;
    }
    
    const gifUrl = gif.media_formats.gif.url;
    console.log('Selected GIF URL:', gifUrl);
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
          <GifIcon size={18} />
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
          ) : error ? (
            <div className="flex items-center justify-center h-full text-center p-4">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center p-4">
              <p className="text-sm text-muted-foreground">
                {searchTerm ? `No GIFs found for "${searchTerm}"` : "No featured GIFs available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelectGif(gif)}
                  className="aspect-video rounded overflow-hidden hover:opacity-90 transition-opacity"
                >
                  {gif.media_formats && gif.media_formats.tinygif && gif.media_formats.tinygif.url ? (
                    <img
                      src={gif.media_formats.tinygif.url}
                      alt={gif.content_description || "GIF"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-500">GIF unavailable</span>
                    </div>
                  )}
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
