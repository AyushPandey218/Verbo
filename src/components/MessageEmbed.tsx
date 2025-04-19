
import React, { useState, useEffect } from 'react';
import { Youtube, Link as LinkIcon, Video, Image as ImageIcon } from 'lucide-react';
import { Card } from './ui/card';

interface MessageEmbedProps {
  url: string;
}

const MessageEmbed: React.FC<MessageEmbedProps> = ({ url }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [embedType, setEmbedType] = useState<'youtube' | 'image' | 'gif' | 'sticker' | 'link'>('link');
  const [metadata, setMetadata] = useState<{
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
  }>({});
  const [error, setError] = useState<boolean>(false);
  const [mediaUrl, setMediaUrl] = useState<string>('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // For local development and testing, you can use this mock data
        if (url.includes('example.com')) {
          setMetadata({
            title: 'Example Website',
            description: 'This is an example website description',
            image: 'https://via.placeholder.com/300x200',
            favicon: 'https://example.com/favicon.ico'
          });
          setIsLoading(false);
          return;
        }

        // In a real implementation, you would fetch the metadata from your backend
        // For now, we'll extract what we can from the URL
        const urlObj = new URL(url);
        setMetadata({
          title: urlObj.hostname,
          description: url,
          favicon: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
        });
      } catch (err) {
        console.error("Error fetching metadata:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Determine the type of embed to show
    try {
      if (url.startsWith('[sticker]') && url.endsWith('[/sticker]')) {
        setEmbedType('sticker');
        const extractedUrl = url.replace('[sticker]', '').replace('[/sticker]', '').trim();
        setMediaUrl(extractedUrl);
        setIsLoading(false);
      } else if (url.startsWith('[gif]') && url.endsWith('[/gif]')) {
        setEmbedType('gif');
        const extractedUrl = url.replace('[gif]', '').replace('[/gif]', '').trim();
        setMediaUrl(extractedUrl);
        setIsLoading(false);
      } else if (isYouTubeUrl(url)) {
        setEmbedType('youtube');
        fetchMetadata();
      } else if (isImageUrl(url)) {
        setEmbedType('image');
        setMediaUrl(url);
        setIsLoading(false);
      } else {
        setEmbedType('link');
        fetchMetadata();
      }
    } catch (err) {
      console.error("Error processing URL:", err);
      setError(true);
      setIsLoading(false);
    }
  }, [url]);

  const getYouTubeVideoId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search);
      return searchParams.get('v');
    } catch (e) {
      return null;
    }
  };

  const isYouTubeUrl = (url: string): boolean => {
    try {
      return url.includes('youtube.com') || url.includes('youtu.be');
    } catch (e) {
      return false;
    }
  };

  const isImageUrl = (url: string): boolean => {
    try {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.gif', '.webp'];
      return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
    } catch (e) {
      return false;
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-4 bg-gray-200 rounded w-16 mt-2"></div>;
  }

  if (error) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 text-sm text-violet-600 hover:text-violet-700 transition-colors"
      >
        <LinkIcon size={16} />
        {url}
      </a>
    );
  }

  if (embedType === 'sticker') {
    return (
      <div className="mt-2 inline-block max-w-[120px]">
        <img 
          src={mediaUrl} 
          alt="Sticker" 
          className="w-full h-auto"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  if (embedType === 'gif') {
    return (
      <div className="mt-2 rounded-lg overflow-hidden shadow-sm max-w-[300px]">
        <img 
          src={mediaUrl} 
          alt="GIF" 
          className="w-full h-auto rounded-lg"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  if (embedType === 'youtube' && getYouTubeVideoId(url)) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden shadow-sm">
        <iframe
          width="100%"
          height="200"
          src={`https://www.youtube.com/embed/${getYouTubeVideoId(url)}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full aspect-video"
        ></iframe>
      </div>
    );
  }

  if (embedType === 'image') {
    return (
      <div className="mt-2 rounded-lg overflow-hidden shadow-sm max-w-xs">
        <img 
          src={mediaUrl} 
          alt="Embedded image" 
          className="w-full h-auto rounded-lg"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <Card className="mt-2 overflow-hidden max-w-md hover:bg-gray-50 transition-colors">
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex flex-col"
      >
        {metadata.image && (
          <div className="aspect-video bg-gray-100 overflow-hidden">
            <img 
              src={metadata.image} 
              alt={metadata.title || 'Link preview'} 
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {metadata.favicon && (
              <img 
                src={metadata.favicon} 
                alt="" 
                className="w-4 h-4"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
            <span className="text-sm font-medium text-violet-600">{metadata.title}</span>
          </div>
          {metadata.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{metadata.description}</p>
          )}
        </div>
      </a>
    </Card>
  );
};

export default MessageEmbed;
