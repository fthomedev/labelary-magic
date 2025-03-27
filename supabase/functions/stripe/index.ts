
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

    switch (action) {
      case 'create-checkout-session': {
        const { priceId, customerId, successUrl, cancelUrl } = data;
        
        if (!priceId || !successUrl || !cancelUrl) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verifique se o priceId é válido
        try {
          // Tentativa de obter o preço para validar
          await stripe.prices.retrieve(priceId);
        } catch (priceError) {
          console.error('Invalid price ID:', priceError);
          return new Response(
            JSON.stringify({ error: `Invalid price ID: ${priceId}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const params = {
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
        };

        // Add customer ID if provided
        if (customerId) {
          params.customer = customerId;
        }

        const session = await stripe.checkout.sessions.create(params);

        return new Response(
          JSON.stringify({ url: session.url }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-prices': {
        // If we don't have any subscription products in Stripe yet, let's create them
        const products = await stripe.products.list({ active: true });
        
        if (products.data.length === 0) {
          // Create Basic Plan product
          const basicProduct = await stripe.products.create({
            name: 'Plano Básico',
            description: 'Até 100 processamentos por dia',
            metadata: {
              limit: 'Até 100 processamentos por dia',
              features: 'Suporte por email,Acesso a todas as funcionalidades básicas'
            }
          });
          
          // Create price for Basic Plan (R$9.90/month)
          await stripe.prices.create({
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
          
          // Create Advanced Plan product
          const advancedProduct = await stripe.products.create({
            name: 'Plano Avançado',
            description: 'Processamentos ilimitados',
            metadata: {
              limit: 'Processamentos ilimitados',
              features: 'Suporte prioritário,Acesso a todas as funcionalidades,Sem restrições de uso'
            }
          });
          
          // Create price for Advanced Plan (R$15.90/month)
          await stripe.prices.create({
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
        }

        const prices = await stripe.prices.list({
          active: true,
          limit: 10,
          expand: ['data.product'],
        });

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

        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          expand: ['data.default_payment_method'],
        });

        return new Response(
          JSON.stringify(subscriptions.data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
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
