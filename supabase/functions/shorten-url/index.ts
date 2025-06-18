
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShortenUrlRequest {
  url: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url }: ShortenUrlRequest = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Attempting to shorten URL:', url.substring(0, 100) + '...');
    
    // Try is.gd first
    try {
      const response = await fetch('https://is.gd/create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          format: 'simple',
          url: url,
        }),
      });

      if (response.ok) {
        const shortUrl = await response.text();
        
        if (shortUrl.startsWith('http') && shortUrl.length < url.length) {
          console.log('Successfully shortened with is.gd:', shortUrl);
          return new Response(
            JSON.stringify({ shortUrl: shortUrl.trim() }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    } catch (error) {
      console.log('is.gd failed:', error.message);
    }

    // Try tinyurl as fallback
    try {
      console.log('is.gd failed, trying tinyurl...');
      const tinyResponse = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      
      if (tinyResponse.ok) {
        const tinyUrl = await tinyResponse.text();
        if (tinyUrl.startsWith('http') && tinyUrl.length < url.length) {
          console.log('Successfully shortened with tinyurl:', tinyUrl);
          return new Response(
            JSON.stringify({ shortUrl: tinyUrl.trim() }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    } catch (error) {
      console.log('tinyurl failed:', error.message);
    }

    // If both services fail, return original URL
    console.warn('All URL shortening services failed, using original URL');
    return new Response(
      JSON.stringify({ shortUrl: url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in shorten-url function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);
