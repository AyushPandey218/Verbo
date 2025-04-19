
// Updated Tenor API key - using official Tenor API test key
const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';  // Public test API key provided by Tenor
const TENOR_CLIENT_KEY = 'verbo_chat_app';

export interface TenorGif {
  id: string;
  title: string;
  url: string;
  preview: string;
}

export const searchTenorGifs = async (searchTerm: string): Promise<TenorGif[]> => {
  try {
    console.log(`Searching for GIFs with term: ${searchTerm}`);
    const response = await fetch(
      `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&limit=20`
    );
    
    if (!response.ok) {
      console.error('Failed to fetch GIFs:', await response.text());
      throw new Error('Failed to fetch GIFs');
    }
    
    const data = await response.json();
    console.log('GIF search response:', data);
    
    return data.results.map((result: any) => ({
      id: result.id,
      title: result.title,
      url: result.media_formats.gif.url,
      preview: result.media_formats.tinygif.url,
    }));
  } catch (error) {
    console.error('Error fetching GIFs:', error);
    return [];
  }
};

export const getTrendingGifs = async (): Promise<TenorGif[]> => {
  try {
    console.log('Fetching trending GIFs');
    const response = await fetch(
      `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&limit=20`
    );
    
    if (!response.ok) {
      console.error('Failed to fetch trending GIFs:', await response.text());
      throw new Error('Failed to fetch trending GIFs');
    }
    
    const data = await response.json();
    console.log('Trending GIFs response:', data);
    
    return data.results.map((result: any) => ({
      id: result.id,
      title: result.title,
      url: result.media_formats.gif.url,
      preview: result.media_formats.tinygif.url,
    }));
  } catch (error) {
    console.error('Error fetching trending GIFs:', error);
    return [];
  }
};
