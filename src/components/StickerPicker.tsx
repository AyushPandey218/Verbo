
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Sticker, Search } from 'lucide-react';
import { searchTenorGifs, getTrendingGifs, TenorGif } from '@/utils/tenorApi';

interface StickerPickerProps {
  onSelect: (url: string, type: 'sticker' | 'gif') => void;
  onClose: () => void;
}

const STICKERS = [
  { url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Thumbs%20up/3D/thumbs_up_3d.png', category: 'reactions' },
  { url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Thumbs%20down/3D/thumbs_down_3d.png', category: 'reactions' },
  { url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Clapping%20hands/3D/clapping_hands_3d.png', category: 'reactions' },
  { url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Face%20with%20tears%20of%20joy/3D/face_with_tears_of_joy_3d.png', category: 'emotions' },
  { url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Party%20popper/3D/party_popper_3d.png', category: 'celebrations' },
  { url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Heart/3D/heart_3d.png', category: 'emotions' },
  { url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/3D/fire_3d.png', category: 'symbols' },
  { url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Trophy/3D/trophy_3d.png', category: 'celebrations' },
  { url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkles/3D/sparkles_3d.png', category: 'symbols' },
  { url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Face%20blowing%20a%20kiss/3D/face_blowing_a_kiss_3d.png', category: 'emotions' },
];

const StickerPicker: React.FC<StickerPickerProps> = ({ onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stickers');

  useEffect(() => {
    if (activeTab === 'gifs') {
      loadTrendingGifs();
    }
  }, [activeTab]);

  const loadTrendingGifs = async () => {
    setLoading(true);
    const trending = await getTrendingGifs();
    setGifs(trending);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadTrendingGifs();
      return;
    }
    
    setLoading(true);
    const results = await searchTenorGifs(searchTerm);
    setGifs(results);
    setLoading(false);
  };

  return (
    <Tabs defaultValue="stickers" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="w-full">
        <TabsTrigger value="stickers" className="flex-1">Stickers</TabsTrigger>
        <TabsTrigger value="gifs" className="flex-1">GIFs</TabsTrigger>
      </TabsList>
      
      <TabsContent value="stickers" className="mt-2">
        <div className="grid grid-cols-3 gap-2 p-2 max-h-[300px] overflow-y-auto">
          {STICKERS.map((sticker, index) => (
            <Button
              key={index}
              variant="ghost"
              className="p-2 h-auto aspect-square hover:bg-gray-100 transition-colors"
              onClick={() => onSelect(sticker.url, 'sticker')}
            >
              <img src={sticker.url} alt="Sticker" className="w-full h-full object-contain" />
            </Button>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="gifs" className="mt-2">
        <div className="p-2 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Search GIFs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} size="icon">
              <Search size={18} />
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {gifs.map((gif) => (
                <Button
                  key={gif.id}
                  variant="ghost"
                  className="p-1 h-auto aspect-video hover:bg-gray-100 transition-colors"
                  onClick={() => onSelect(gif.url, 'gif')}
                >
                  <img 
                    src={gif.preview} 
                    alt={gif.title}
                    className="w-full h-full object-cover rounded-sm"
                  />
                </Button>
              ))}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default StickerPicker;
