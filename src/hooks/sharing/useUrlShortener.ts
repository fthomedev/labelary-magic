
import { useState } from 'react';

export const useUrlShortener = () => {
  const [isShortening, setIsShortening] = useState(false);

  const shortenUrl = async (longUrl: string): Promise<string> => {
    setIsShortening(true);
    
    try {
      // Usar serviço gratuito de encurtamento de URL
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

      if (!response.ok) {
        throw new Error('Failed to shorten URL');
      }

      const shortUrl = await response.text();
      
      // Validar se a resposta é uma URL válida
      if (shortUrl.startsWith('http')) {
        return shortUrl.trim();
      } else {
        // Se o serviço falhar, retornar a URL original
        console.warn('URL shortening failed, using original URL');
        return longUrl;
      }
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
