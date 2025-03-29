
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe with test mode key
function initializeStripe() {
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || 'sk_test_51R6iAqBLaDKP56zdyAArtHj8Sd2Fxfr66bizL0NHFxOJtlaOOE6jBJgDEHbgXLlFIgBpIysSQZOrOho1FeW6E2RP009ViMszRz';
  
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  
  console.log('Using Stripe in TEST mode with test key');
  
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    maxNetworkRetries: 3,
  });
}

// Find or create a price for a product
async function findOrCreatePrice(stripe, productId, amount, currency, interval) {
  try {
    // Check if a test price already exists for the product
    const prices = await stripe.prices.list({
      limit: 1,
      active: true,
      product: productId,
    });
    
    if (prices.data.length > 0) {
      console.log(`Found existing test price for product: ${productId}`, prices.data[0].id);
      return prices.data[0];
    }
    
    // Create test price if it doesn't exist
    const testPrice = await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency: currency,
      recurring: {
        interval: interval,
      },
      lookup_key: productId === 'prod_S1qlt19OAovrSE' ? 'basic_test_plan' : 'advanced_test_plan',
    });
    
    console.log(`Created new test price for product ${productId}:`, testPrice.id);
    return testPrice;
  } catch (err) {
    console.error(`Error setting up test price for product ${productId}:`, err);
    throw err;
  }
}

// Get checkout items based on price ID
async function getCheckoutItems(stripe, priceId) {
  let checkoutItems = [];
  
  // Basic plan
  if (priceId === 'basic' || priceId === 'prod_S1qlt19OAovrSE') {
    console.log('Using test mode basic plan with product ID: prod_S1qlt19OAovrSE');
    const testPrice = await findOrCreatePrice(stripe, 'prod_S1qlt19OAovrSE', 990, 'brl', 'month');
    checkoutItems.push({
      price: testPrice.id,
      quantity: 1,
    });
  } 
  // Advanced plan
  else if (priceId === 'advanced' || priceId === 'prod_S1qmbByFFnRUaT') {
    console.log('Using test mode advanced plan with product ID: prod_S1qmbByFFnRUaT');
    const testPrice = await findOrCreatePrice(stripe, 'prod_S1qmbByFFnRUaT', 1590, 'brl', 'month');
    checkoutItems.push({
      price: testPrice.id,
      quantity: 1,
    });
  } 
  // Direct price ID
  else if (priceId.startsWith('price_')) {
    checkoutItems.push({
      price: priceId,
      quantity: 1,
    });
  } 
  // Product ID
  else if (priceId.startsWith('prod_')) {
    try {
      const prices = await stripe.prices.list({
        product: priceId,
        active: true,
        limit: 1,
      });
      
      if (prices.data.length === 0) {
        console.log(`No active prices found for product: ${priceId}, falling back to basic plan`);
        return getCheckoutItems(stripe, 'prod_S1qlt19OAovrSE');
      }
      
      checkoutItems.push({
        price: prices.data[0].id,
        quantity: 1,
      });
    } catch (error) {
      console.error('Error finding price for product:', error);
      return getCheckoutItems(stripe, 'prod_S1qlt19OAovrSE');
    }
  } 
  // Fallback to basic plan
  else {
    console.log(`Unrecognized priceId format: ${priceId}, using basic plan fallback`);
    return getCheckoutItems(stripe, 'prod_S1qlt19OAovrSE');
  }
  
  return checkoutItems;
}

// Create a checkout session
async function createCheckoutSession(stripe, data) {
  const { priceId, customerId, successUrl, cancelUrl } = data;
  
  if (!priceId || !successUrl || !cancelUrl) {
    throw new Error('Missing required parameters');
  }

  // Get checkout items
  const checkoutItems = await getCheckoutItems(stripe, priceId);

  // Setup checkout session parameters with test mode explicitly set
  const params = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: checkoutItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Add critical parameter to prevent embedding issues
    payment_method_collection: 'always',
    // Add billing address collection to improve success rates
    billing_address_collection: 'auto',
    // Add locale for better browser compatibility
    locale: 'pt-BR',
    // Optimize checkout completion
    submit_type: 'auto',
    // Expire sessions quicker to free resources
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes from now
    
    // Add test mode flag explicitly
    metadata: {
      is_test_mode: 'true'
    }
  };

  // Add customer if provided
  if (customerId) {
    params.customer = customerId;
    console.log(`Using existing customer ID: ${customerId}`);
  }

  // Create checkout session
  console.log('Creating checkout session with params:', JSON.stringify(params));
  const session = await stripe.checkout.sessions.create(params);
  console.log(`Checkout session created: ${session.id}, URL: ${session.url}`);
  console.log('Checkout session result:', JSON.stringify({ url: session.url }));

  return { url: session.url };
}

// Get subscription prices
async function getPrices(stripe) {
  console.log('Fetching prices from Stripe');
  
  // Create default subscription products if none exist
  const products = await stripe.products.list({ active: true });
  
  if (products.data.length === 0) {
    console.log('No products found. Creating default subscription products...');
    
    // Create basic product
    const basicProduct = await stripe.products.create({
      id: 'prod_S1qlt19OAovrSE',
      name: 'Plano Básico',
      description: 'Até 100 processamentos por dia',
      metadata: {
        limit: 'Até 100 processamentos por dia',
        features: 'Suporte por email,Acesso a todas as funcionalidades básicas'
      }
    });
    
    console.log(`Created basic product: ${basicProduct.id}`);
    
    // Create price for basic product
    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 990, // R$9.90
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
      metadata: {
        type: 'basic'
      },
      lookup_key: 'basic_test_plan'
    });
    
    console.log(`Created price for basic product: ${basicPrice.id}`);
    
    // Create advanced product
    const advancedProduct = await stripe.products.create({
      id: 'prod_S1qmbByFFnRUaT',
      name: 'Plano Avançado',
      description: 'Processamentos ilimitados',
      metadata: {
        limit: 'Processamentos ilimitados',
        features: 'Suporte prioritário,Acesso a todas as funcionalidades,Sem restrições de uso'
      }
    });
    
    console.log(`Created advanced product: ${advancedProduct.id}`);
    
    // Create price for advanced product
    const advancedPrice = await stripe.prices.create({
      product: advancedProduct.id,
      unit_amount: 1590, // R$15.90
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
      metadata: {
        type: 'advanced'
      },
      lookup_key: 'advanced_test_plan'
    });
    
    console.log(`Created price for advanced product: ${advancedPrice.id}`);
  } else {
    console.log(`Found ${products.data.length} existing products`);
  }

  // Get prices with products
  const prices = await stripe.prices.list({
    active: true,
    limit: 10,
    expand: ['data.product'],
  });

  console.log(`Returning ${prices.data.length} prices`);
  return prices.data;
}

// Get customer subscription
async function getCustomerSubscription(stripe, customerId) {
  if (!customerId) {
    throw new Error('Customer ID is required');
  }

  console.log(`Fetching subscriptions for customer: ${customerId}`);
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    expand: ['data.default_payment_method'],
  });

  console.log(`Found ${subscriptions.data.length} active subscriptions`);
  return subscriptions.data;
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
    console.log(`Stripe function called with action: ${action}`, data);
    
    // Process different actions
    switch (action) {
      case 'create-checkout-session': {
        try {
          const result = await createCheckoutSession(stripe, data);
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error creating checkout session:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get-prices': {
        try {
          const prices = await getPrices(stripe);
          return new Response(
            JSON.stringify(prices),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching prices:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get-customer-subscription': {
        try {
          const subscriptions = await getCustomerSubscription(stripe, data.customerId);
          return new Response(
            JSON.stringify(subscriptions),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error fetching customer subscription:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

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
