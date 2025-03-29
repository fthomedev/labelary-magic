
import Stripe from "https://esm.sh/stripe@12.18.0";
import { findOrCreatePrice } from "../utils/priceUtils.ts";
import { corsHeaders } from "../utils/cors.ts";

// Get checkout items based on price ID
export async function getCheckoutItems(stripe: Stripe, priceId: string) {
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
export async function createCheckoutSession(stripe: Stripe, data: any) {
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

// Handler for create-checkout-session action
export async function handleCreateCheckoutSession(stripe: Stripe, data: any) {
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
