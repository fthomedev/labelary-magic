
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { corsHeaders } from "./utils/cors.ts";
import { initializeStripe } from "./utils/stripe.ts";
import { handleCreateCheckoutSession } from "./handlers/checkoutSession.ts";
import { handleGetPrices } from "./handlers/prices.ts";
import { handleGetCustomerSubscription } from "./handlers/subscription.ts";
import { handleCreateDonationSession } from "./handlers/donation.ts";

// Actions that require authentication
const PROTECTED_ACTIONS = ['create-checkout-session', 'get-customer-subscription'];

// Actions that don't require authentication (public endpoints)
const PUBLIC_ACTIONS = ['get-prices', 'create-donation-session'];

// Helper function to authenticate user
async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return { user: null, error: 'Missing authorization header' };
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabaseClient.auth.getUser();
  
  if (error || !user) {
    console.error('Authentication error:', error?.message || 'No user found');
    return { user: null, error: 'Unauthorized', supabaseClient: null };
  }

  return { user, error: null, supabaseClient };
}

// Helper function to validate customer ID belongs to authenticated user
async function validateCustomerOwnership(supabaseClient: any, userId: string, customerId: string) {
  const { data: subscription, error } = await supabaseClient
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error validating customer ownership:', error);
    return false;
  }

  // If no subscription found or customer ID doesn't match, deny access
  if (!subscription || subscription.stripe_customer_id !== customerId) {
    console.error(`Customer ID mismatch: expected ${subscription?.stripe_customer_id}, got ${customerId}`);
    return false;
  }

  return true;
}

// Main request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe client with test mode
    let stripe;
    try {
      stripe = initializeStripe();
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to initialize Stripe client' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { action, ...data } = await req.json();
    console.log(`Stripe function called with action: ${action}`);
    
    // Check if action requires authentication
    const requiresAuth = PROTECTED_ACTIONS.includes(action);
    let authenticatedUser = null;
    let supabaseClient = null;

    if (requiresAuth) {
      const authResult = await authenticateUser(req);
      
      if (authResult.error) {
        console.error(`Authentication required for action ${action} but failed: ${authResult.error}`);
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      authenticatedUser = authResult.user;
      supabaseClient = authResult.supabaseClient;
      console.log(`User authenticated: ${authenticatedUser.id}`);
    }
    
    // Process different actions
    switch (action) {
      case 'create-checkout-session':
        // Validate customer ID if provided
        if (data.customerId && supabaseClient) {
          const isOwner = await validateCustomerOwnership(supabaseClient, authenticatedUser!.id, data.customerId);
          if (!isOwner) {
            console.error(`User ${authenticatedUser!.id} tried to access customer ${data.customerId}`);
            return new Response(
              JSON.stringify({ error: 'Unauthorized: Customer ID does not belong to you' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        return handleCreateCheckoutSession(stripe, data);

      case 'get-prices':
        return handleGetPrices(stripe);

      case 'get-customer-subscription':
        // Validate customer ID belongs to authenticated user
        if (!data.customerId) {
          return new Response(
            JSON.stringify({ error: 'Customer ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const isOwner = await validateCustomerOwnership(supabaseClient!, authenticatedUser!.id, data.customerId);
        if (!isOwner) {
          console.error(`User ${authenticatedUser!.id} tried to access subscription for customer ${data.customerId}`);
          return new Response(
            JSON.stringify({ error: 'Unauthorized: Customer ID does not belong to you' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return handleGetCustomerSubscription(stripe, data);

      case 'create-donation-session':
        // Donations are public - no auth required
        return handleCreateDonationSession(stripe, data);

      default:
        console.error(`Invalid action: ${action}`);
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Stripe API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
