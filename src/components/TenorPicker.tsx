import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sticker } from 'lucide-react';
import { Input } from './ui/input';

interface TenorPickerProps {
  onSelect: (url: string) => void;
}

const TenorPicker: React.FC<TenorPickerProps> = ({ onSelect }) => {
  const [search, setSearch] = React.useState('');
  const [gifs, setGifs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const searchGifs = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${query}&key=AIzaSyDPPd7LoqxU-TIlBwd8pEIkoR9x1QC5AZk&client_key=chat_app&limit=12`
      );
      const data = await response.json();
      setGifs(data.results || []);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-indigo-600"
        >
          <Sticker size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Search GIFs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value) {
                searchGifs(e.target.value);
              }
            }}
            className="w-full"
          />
          <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
            {loading ? (
              <div className="col-span-3 text-center py-4 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : gifs.length > 0 ? (
              gifs.map((gif: any) => (
                <button
                  key={gif.id}
                  className="aspect-square overflow-hidden rounded-lg hover:ring-2 ring-indigo-500 transition-all"
                  onClick={() => onSelect(gif.media_formats.gif.url)}
                >
                  <img
                    src={gif.media_formats.tinygif.url}
                    alt={gif.content_description}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))
            ) : (
              <div className="col-span-3 text-center py-4 text-sm text-muted-foreground">
                {search ? 'No results found' : 'Search for GIFs'}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TenorPicker;
