
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.pathname.split('/').pop();

    console.log('🔍 [DEBUG] Received request for token:', token);

    if (!token) {
      console.error('❌ [ERROR] No token provided in URL');
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 [DEBUG] Looking up token in database:', token);

    // Look up the token in the database
    const { data: tokenData, error: tokenError } = await supabase
      .from('file_access_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.error('❌ [ERROR] Token not found or invalid:', tokenError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ [SUCCESS] Token found, checking expiration...');

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      console.error('❌ [ERROR] Token expired at:', tokenData.expires_at);
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { 
          status: 410, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check access limits
    if (tokenData.max_access !== null && tokenData.accessed_count >= tokenData.max_access) {
      console.error('❌ [ERROR] Access limit exceeded:', tokenData.accessed_count, 'max:', tokenData.max_access);
      return new Response(
        JSON.stringify({ error: 'Access limit exceeded' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📁 [DEBUG] Fetching file from storage:', tokenData.file_path, 'bucket:', tokenData.bucket_name);

    // Get the file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from(tokenData.bucket_name)
      .download(tokenData.file_path);

    if (fileError || !fileData) {
      console.error('❌ [ERROR] File not found or error downloading:', fileError?.message);
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📊 [DEBUG] File downloaded successfully, size:', fileData.size, 'bytes');

    // Update access count (increment by 1)
    const { error: updateError } = await supabase
      .from('file_access_tokens')
      .update({ accessed_count: tokenData.accessed_count + 1 })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('⚠️ [WARNING] Failed to update access count:', updateError.message);
      // Don't fail the request, just log the warning
    }

    console.log('✅ [SUCCESS] File served successfully');

    // Return the file with appropriate headers
    return new Response(fileData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="etiquetas.pdf"',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('💥 [EXCEPTION] Unexpected error in serve-file function:', error);
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
