
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
