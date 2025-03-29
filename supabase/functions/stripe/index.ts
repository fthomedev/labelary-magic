
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { initializeStripe } from "./utils/stripe.ts";
import { handleCreateCheckoutSession } from "./handlers/checkoutSession.ts";
import { handleGetPrices } from "./handlers/prices.ts";
import { handleGetCustomerSubscription } from "./handlers/subscription.ts";

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
    console.log(`Stripe function called with action: ${action}`, data);
    
    // Process different actions
    switch (action) {
      case 'create-checkout-session':
        return handleCreateCheckoutSession(stripe, data);

      case 'get-prices':
        return handleGetPrices(stripe);

      case 'get-customer-subscription':
        return handleGetCustomerSubscription(stripe, data);

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
