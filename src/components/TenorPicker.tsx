import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Search, X, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Tenor API Key - this is a public API key
const TENOR_API_KEY = "AIzaSyAr_Rv9eJ4C0T-jZ2sKTsyHaUI1Z-Yh0nk";
const TENOR_LIMIT = 12;

interface TenorPickerProps {
  onSelect: (gifUrl: string) => void;
  disabled?: boolean;
}

const TenorPicker: React.FC<TenorPickerProps> = ({ onSelect, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGifs = async (searchTerm: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=${TENOR_LIMIT}`;
      
      if (searchTerm) {
        url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${TENOR_API_KEY}&limit=${TENOR_LIMIT}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results) {
        setGifs([]);
        return;
      }
      
      setGifs(data.results);
    } catch (err) {
      console.error('Error fetching GIFs:', err);
      setError('Failed to load GIFs');
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGifs();
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      fetchGifs(search);
    }
  };

  const handleSelectGif = (gifUrl: string) => {
    onSelect(gifUrl);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled}
          className="rounded-full h-10 w-10 bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <Gift size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 sm:w-96 p-3 shadow-lg" align="end">
        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GIFs..."
            className="flex-1"
          />
          <Button type="submit" variant="secondary" size="icon">
            <Search size={16} />
          </Button>
        </form>

        <ScrollArea className="h-64">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchGifs()} 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : gifs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No GIFs found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  className="overflow-hidden rounded-md hover:ring-2 hover:ring-indigo-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() => handleSelectGif(gif.media_formats.gif.url)}
                >
                  <img
                    src={gif.media_formats.tinygif.url}
                    alt="GIF"
                    loading="lazy"
                    className="w-full h-auto object-cover"
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
