
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0";

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
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const { action, ...data } = await req.json();
    console.log(`Stripe function called with action: ${action}`, data);

    switch (action) {
      case 'create-checkout-session': {
        const { priceId, customerId, successUrl, cancelUrl } = data;
        
        if (!priceId || !successUrl || !cancelUrl) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Determine if we're dealing with a product ID or a price ID
        let actualPriceId = priceId;
        
        if (priceId.startsWith('prod_')) {
          console.log(`Input appears to be a product ID: ${priceId}. Looking up associated price...`);
          
          try {
            const prices = await stripe.prices.list({
              product: priceId,
              active: true,
              limit: 1,
            });
            
            if (prices.data.length === 0) {
              console.error(`No active prices found for product: ${priceId}`);
              return new Response(
                JSON.stringify({ error: `No active prices found for product: ${priceId}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            
            actualPriceId = prices.data[0].id;
            console.log(`Successfully converted product ID ${priceId} to price ID ${actualPriceId}`);
          } catch (priceError) {
            console.error('Error finding price for product:', priceError);
            return new Response(
              JSON.stringify({ error: `Invalid product ID or no prices found: ${priceId}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          // It's a price ID, validate it directly
          try {
            const price = await stripe.prices.retrieve(actualPriceId);
            console.log(`Validated price ID ${actualPriceId}, associated with product ${price.product}`);
          } catch (priceError) {
            console.error('Invalid price ID:', priceError);
            return new Response(
              JSON.stringify({ error: `Invalid price ID: ${actualPriceId}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Create the checkout session parameters
        const params = {
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: actualPriceId,
              quantity: 1,
            },
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
        };

        // Add customer ID if provided
        if (customerId) {
          params.customer = customerId;
          console.log(`Using existing customer ID: ${customerId}`);
        }

        // Create the checkout session
        console.log('Creating checkout session with params:', JSON.stringify(params));
        const session = await stripe.checkout.sessions.create(params);
        console.log(`Checkout session created: ${session.id}, URL: ${session.url}`);

        return new Response(
          JSON.stringify({ url: session.url }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-prices': {
        console.log('Fetching prices from Stripe');
        
        // If we don't have any subscription products in Stripe yet, let's create them
        const products = await stripe.products.list({ active: true });
        
        if (products.data.length === 0) {
          console.log('No products found. Creating default subscription products...');
          
          // Create Basic Plan product
          const basicProduct = await stripe.products.create({
            name: 'Plano Básico',
            description: 'Até 100 processamentos por dia',
            metadata: {
              limit: 'Até 100 processamentos por dia',
              features: 'Suporte por email,Acesso a todas as funcionalidades básicas'
            }
          });
          
          console.log(`Created basic product: ${basicProduct.id}`);
          
          // Create price for Basic Plan (R$9.90/month)
          const basicPrice = await stripe.prices.create({
            product: basicProduct.id,
            unit_amount: 990, // R$9.90
            currency: 'brl',
            recurring: {
              interval: 'month',
            },
            metadata: {
              type: 'basic'
            }
          });
          
          console.log(`Created price for basic product: ${basicPrice.id}`);
          
          // Create Advanced Plan product
          const advancedProduct = await stripe.products.create({
            name: 'Plano Avançado',
            description: 'Processamentos ilimitados',
            metadata: {
              limit: 'Processamentos ilimitados',
              features: 'Suporte prioritário,Acesso a todas as funcionalidades,Sem restrições de uso'
            }
          });
          
          console.log(`Created advanced product: ${advancedProduct.id}`);
          
          // Create price for Advanced Plan (R$15.90/month)
          const advancedPrice = await stripe.prices.create({
            product: advancedProduct.id,
            unit_amount: 1590, // R$15.90
            currency: 'brl',
            recurring: {
              interval: 'month',
            },
            metadata: {
              type: 'advanced'
            }
          });
          
          console.log(`Created price for advanced product: ${advancedPrice.id}`);
        } else {
          console.log(`Found ${products.data.length} existing products`);
        }

        const prices = await stripe.prices.list({
          active: true,
          limit: 10,
          expand: ['data.product'],
        });

        console.log(`Returning ${prices.data.length} prices`);
        
        return new Response(
          JSON.stringify(prices.data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-customer-subscription': {
        const { customerId } = data;
        
        if (!customerId) {
          return new Response(
            JSON.stringify({ error: 'Customer ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Fetching subscriptions for customer: ${customerId}`);
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          expand: ['data.default_payment_method'],
        });

        console.log(`Found ${subscriptions.data.length} active subscriptions`);
        
        return new Response(
          JSON.stringify(subscriptions.data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
