import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Starting storage migration...');

    // Get all processing_history records where pdf_path doesn't contain a folder
    const { data: records, error: fetchError } = await supabaseAdmin
      .from('processing_history')
      .select('id, user_id, pdf_path, pdf_url')
      .not('pdf_path', 'is', null);

    if (fetchError) {
      console.error('Error fetching records:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${records?.length || 0} records to check`);

    const results = {
      total: records?.length || 0,
      migrated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const record of records || []) {
      // Skip if already has user folder prefix
      if (record.pdf_path.includes('/')) {
        console.log(`Skipping ${record.pdf_path} - already has folder`);
        results.skipped++;
        continue;
      }

      const oldPath = record.pdf_path;
      const newPath = `${record.user_id}/${record.pdf_path}`;

      console.log(`Migrating: ${oldPath} -> ${newPath}`);

      try {
        // Download the file from old location
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('pdfs')
          .download(oldPath);

        if (downloadError) {
          console.error(`Error downloading ${oldPath}:`, downloadError);
          results.errors.push(`Download failed for ${oldPath}: ${downloadError.message}`);
          continue;
        }

        // Upload to new location
        const { error: uploadError } = await supabaseAdmin.storage
          .from('pdfs')
          .upload(newPath, fileData, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          console.error(`Error uploading ${newPath}:`, uploadError);
          results.errors.push(`Upload failed for ${newPath}: ${uploadError.message}`);
          continue;
        }

        // Update the database record
        const { error: updateError } = await supabaseAdmin
          .from('processing_history')
          .update({ 
            pdf_path: newPath,
            pdf_url: newPath // Store path instead of old public URL
          })
          .eq('id', record.id);

        if (updateError) {
          console.error(`Error updating record ${record.id}:`, updateError);
          results.errors.push(`DB update failed for ${record.id}: ${updateError.message}`);
          continue;
        }

        // Delete old file
        const { error: deleteError } = await supabaseAdmin.storage
          .from('pdfs')
          .remove([oldPath]);

        if (deleteError) {
          console.warn(`Warning: Could not delete old file ${oldPath}:`, deleteError);
          // Don't fail the migration if delete fails
        }

        console.log(`Successfully migrated: ${oldPath} -> ${newPath}`);
        results.migrated++;

      } catch (err) {
        console.error(`Error processing ${oldPath}:`, err);
        results.errors.push(`Error processing ${oldPath}: ${err.message}`);
      }
    }

    console.log('Migration complete:', results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
