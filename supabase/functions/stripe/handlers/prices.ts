
import Stripe from "https://esm.sh/stripe@12.18.0";
import { corsHeaders } from "../utils/cors.ts";

// Get subscription prices
export async function getPrices(stripe: Stripe) {
  console.log('Fetching prices from Stripe');
  
  // Create default subscription products if none exist
  const products = await stripe.products.list({ active: true });
  
  if (products.data.length === 0) {
    console.log('No products found. Creating default subscription products...');
    
    // Create basic product
    const basicProduct = await stripe.products.create({
      id: 'prod_basic_plan',
      name: 'Plano Básico',
      description: 'Até 50 processamentos por dia',
      metadata: {
        limit: '50',
        features: 'Suporte por email,Acesso a todas as funcionalidades básicas'
      }
    });
    
    console.log(`Created basic product: ${basicProduct.id}`);
    
    // Create price for basic product
    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 499, // R$4.99
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
      metadata: {
        usage_limit: '50',
        type: 'basic'
      },
      lookup_key: 'basic_plan'
    });
    
    console.log(`Created price for basic product: ${basicPrice.id}`);
    
    // Create advanced product
    const advancedProduct = await stripe.products.create({
      id: 'prod_advanced_plan',
      name: 'Plano Avançado',
      description: 'Até 100 processamentos por dia',
      metadata: {
        limit: '100',
        features: 'Suporte prioritário,Acesso a todas as funcionalidades,Múltiplos usuários'
      }
    });
    
    console.log(`Created advanced product: ${advancedProduct.id}`);
    
    // Create price for advanced product
    const advancedPrice = await stripe.prices.create({
      product: advancedProduct.id,
      unit_amount: 999, // R$9.99
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
      metadata: {
        usage_limit: '100',
        type: 'advanced'
      },
      lookup_key: 'advanced_plan'
    });
    
    console.log(`Created price for advanced product: ${advancedPrice.id}`);
    
    // Create unlimited product
    const unlimitedProduct = await stripe.products.create({
      id: 'prod_unlimited_plan',
      name: 'Plano Ilimitado',
      description: 'Processamentos ilimitados',
      metadata: {
        limit: '-1',
        features: 'Suporte prioritário 24/7,Acesso a todas as funcionalidades,Múltiplos usuários,Recursos avançados'
      }
    });
    
    console.log(`Created unlimited product: ${unlimitedProduct.id}`);
    
    // Create price for unlimited product
    const unlimitedPrice = await stripe.prices.create({
      product: unlimitedProduct.id,
      unit_amount: 1999, // R$19.99
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
      metadata: {
        usage_limit: '-1',
        type: 'unlimited'
      },
      lookup_key: 'unlimited_plan'
    });
    
    console.log(`Created price for unlimited product: ${unlimitedPrice.id}`);
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

// Handler for get-prices action
export async function handleGetPrices(stripe: Stripe) {
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
