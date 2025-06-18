
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUrlShortener = () => {
  const [isShortening, setIsShortening] = useState(false);

  const shortenUrl = async (longUrl: string): Promise<string> => {
    setIsShortening(true);
    
    try {
      console.log('Attempting to shorten URL via Edge Function:', longUrl.substring(0, 100) + '...');
      
      const { data, error } = await supabase.functions.invoke('shorten-url', {
        body: { url: longUrl }
      });

      if (error) {
        console.error('Error calling shorten-url function:', error);
        return longUrl;
      }

      if (data?.shortUrl) {
        console.log('Successfully shortened URL:', data.shortUrl);
        console.log('Original length:', longUrl.length, 'Shortened length:', data.shortUrl.length);
        return data.shortUrl;
      }

      console.warn('No shortUrl returned from function, using original URL');
      return longUrl;
    } catch (error) {
      console.error('Error shortening URL:', error);
      return longUrl;
    } finally {
      setIsShortening(false);
    }
  };

  return {
    shortenUrl,
    isShortening,
  };
};
