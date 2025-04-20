import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GIF_API_KEY, GIF_API_URL } from '@/utils/config';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TenorPickerProps {
  onSelect: (gifUrl: string) => void;
}

const TenorPicker: React.FC<TenorPickerProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchGifs = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchEndpoint = `${GIF_API_URL}/search?api_key=${GIF_API_KEY}&q=${encodeURIComponent(term)}&limit=20&rating=pg-13`;
      console.log('Searching GIFs with endpoint:', searchEndpoint);
      
      const response = await fetch(searchEndpoint);
      
      if (!response.ok) {
        throw new Error(`GIPHY API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('GIPHY search response:', data);
      
      if (data.data && Array.isArray(data.data)) {
        setGifs(data.data);
      } else {
        console.error('Invalid GIPHY API response format:', data);
        setError('Invalid response from GIPHY API');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get GIFs from GIPHY API",
        });
        setGifs([]);
      }
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setError('Failed to fetch GIFs. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch GIFs. Please try again.",
      });
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getTrendingGifs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const trendingEndpoint = `${GIF_API_URL}/trending?api_key=${GIF_API_KEY}&limit=20&rating=pg-13`;
      console.log('Fetching trending GIFs with endpoint:', trendingEndpoint);
      
      const response = await fetch(trendingEndpoint);
      
      if (!response.ok) {
        throw new Error(`GIPHY API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('GIPHY trending response:', data);
      
      if (data.data && Array.isArray(data.data)) {
        setGifs(data.data);
      } else {
        console.error('Invalid GIPHY API response format:', data);
        setError('Invalid response from GIPHY API');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get trending GIFs",
        });
        setGifs([]);
      }
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
      setError('Failed to fetch GIFs. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch GIFs. Please try again.",
      });
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      getTrendingGifs();
    }
  }, [isOpen, getTrendingGifs]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm && isOpen) {
        searchGifs(searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, searchGifs, isOpen]);

  const handleSelectGif = (gif: any) => {
    // Get the GIF URL from GIPHY's data structure
    let gifUrl = null;
    
    if (gif.images && gif.images.fixed_height) {
      gifUrl = gif.images.fixed_height.url;
    } else if (gif.images && gif.images.original) {
      gifUrl = gif.images.original.url;
    } else if (gif.images && gif.images.downsized) {
      gifUrl = gif.images.downsized.url;
    }
    
    if (!gifUrl) {
      console.error('Could not find valid GIF URL in format:', gif);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid GIF format. Please try another one.",
      });
      return;
    }
    
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
          <Gift size={18} />
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
                {searchTerm ? `No GIFs found for "${searchTerm}"` : "No GIFs available"}
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
                  {gif.images && gif.images.fixed_width_small ? (
                    <img
                      src={gif.images.fixed_width_small.url}
                      alt={gif.title || "GIF"}
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
