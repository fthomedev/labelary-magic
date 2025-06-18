
import { useState } from 'react';

export const useUrlShortener = () => {
  const [isShortening, setIsShortening] = useState(false);

  const shortenUrl = async (longUrl: string): Promise<string> => {
    setIsShortening(true);
    
    try {
      console.log('Attempting to shorten URL:', longUrl.substring(0, 100) + '...');
      
      // Tentar primeiro com is.gd
      const response = await fetch('https://is.gd/create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          format: 'simple',
          url: longUrl,
        }),
      });

      if (response.ok) {
        const shortUrl = await response.text();
        
        // Validar se a resposta é uma URL válida e realmente mais curta
        if (shortUrl.startsWith('http') && shortUrl.length < longUrl.length) {
          console.log('Successfully shortened with is.gd:', shortUrl);
          return shortUrl.trim();
        }
      }

      // Se is.gd falhar, tentar com tinyurl
      console.log('is.gd failed, trying tinyurl...');
      const tinyResponse = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      
      if (tinyResponse.ok) {
        const tinyUrl = await tinyResponse.text();
        if (tinyUrl.startsWith('http') && tinyUrl.length < longUrl.length) {
          console.log('Successfully shortened with tinyurl:', tinyUrl);
          return tinyUrl.trim();
        }
      }

      // Se ambos falharem, retornar a URL original (não ideal, mas funcional)
      console.warn('All URL shortening services failed, using original URL');
      return longUrl;
    } catch (error) {
      console.error('Error shortening URL:', error);
      // Em caso de erro, retornar a URL original
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
