
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
    // Configuring Stripe client
    const { action, ...data } = await req.json();
    console.log(`Stripe function called with action: ${action}`, data);
    
    // Use the test key provided
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || 'sk_test_51R6iAqBLaDKP56zdyAArtHj8Sd2Fxfr66bizL0NHFxOJtlaOOE6jBJgDEHbgXLlFIgBpIysSQZOrOho1FeW6E2RP009ViMszRz';
    
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      maxNetworkRetries: 3, // Add retry logic
    });

    switch (action) {
      case 'create-checkout-session': {
        const { priceId, customerId, successUrl, cancelUrl } = data;
        
        if (!priceId || !successUrl || !cancelUrl) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Prepare checkout items
        let checkoutItems = [];
        
        if (priceId === 'basic' || priceId === 'prod_S109EaoLA02QYK') {
          // Basic plan (using provided product ID or "basic" name)
          console.log('Using test mode basic plan');
          try {
            // Check if a test price already exists for the basic plan
            const prices = await stripe.prices.list({
              limit: 1,
              active: true,
              lookup_keys: ['basic_test_plan'],
            });
            
            let testPrice;
            if (prices.data.length > 0) {
              testPrice = prices.data[0];
              console.log('Found existing test price:', testPrice.id);
            } else {
              // Create test product and price if it doesn't exist
              const testProduct = await stripe.products.create({
                name: 'Plano Básico (Test)',
                description: 'Plano de teste - até 100 processamentos por dia',
                active: true,
              });
              
              testPrice = await stripe.prices.create({
                product: testProduct.id,
                unit_amount: 990, // R$9.90
                currency: 'brl',
                recurring: {
                  interval: 'month',
                },
                lookup_key: 'basic_test_plan',
              });
              console.log('Created new test price:', testPrice.id);
            }
            
            checkoutItems.push({
              price: testPrice.id,
              quantity: 1,
            });
          } catch (err) {
            console.error('Error setting up test price:', err);
            throw err;
          }
        } else if (priceId === 'advanced' || priceId === 'prod_S109H2KiOoZULm') {
          // Advanced plan (using provided product ID or "advanced" name)
          console.log('Using test mode advanced plan');
          try {
            // Check if a test price already exists for the advanced plan
            const prices = await stripe.prices.list({
              limit: 1,
              active: true,
              lookup_keys: ['advanced_test_plan'],
            });
            
            let testPrice;
            if (prices.data.length > 0) {
              testPrice = prices.data[0];
              console.log('Found existing test price:', testPrice.id);
            } else {
              // Create test product and price if it doesn't exist
              const testProduct = await stripe.products.create({
                name: 'Plano Avançado (Test)',
                description: 'Plano de teste - processamentos ilimitados',
                active: true,
              });
              
              testPrice = await stripe.prices.create({
                product: testProduct.id,
                unit_amount: 1590, // R$15.90
                currency: 'brl',
                recurring: {
                  interval: 'month',
                },
                lookup_key: 'advanced_test_plan',
              });
              console.log('Created new test price:', testPrice.id);
            }
            
            checkoutItems.push({
              price: testPrice.id,
              quantity: 1,
            });
          } catch (err) {
            console.error('Error setting up test price:', err);
            throw err;
          }
        } else if (priceId.startsWith('price_')) {
          // If it's already a valid price ID, use it directly
          checkoutItems.push({
            price: priceId,
            quantity: 1,
          });
        } else if (priceId.startsWith('prod_')) {
          // If it's a product ID, try to find an associated price
          try {
            const prices = await stripe.prices.list({
              product: priceId,
              active: true,
              limit: 1,
            });
            
            if (prices.data.length === 0) {
              // If no test mode prices found for this product, create one
              console.log(`No active prices found for product: ${priceId}, creating test price`);
              
              const testProduct = await stripe.products.create({
                name: 'Test Product',
                description: 'Generated test product',
                active: true,
              });
              
              const testPrice = await stripe.prices.create({
                product: testProduct.id,
                unit_amount: 990, // R$9.90
                currency: 'brl',
                recurring: {
                  interval: 'month',
                },
              });
              
              checkoutItems.push({
                price: testPrice.id,
                quantity: 1,
              });
            } else {
              checkoutItems.push({
                price: prices.data[0].id,
                quantity: 1,
              });
            }
          } catch (error) {
            console.error('Error finding price for product:', error);
            
            // Create a fallback test product in case of error
            const testProduct = await stripe.products.create({
              name: 'Fallback Test Product',
              description: 'Generated after error with original product',
              active: true,
            });
            
            const testPrice = await stripe.prices.create({
              product: testProduct.id,
              unit_amount: 990, // R$9.90
              currency: 'brl',
              recurring: {
                interval: 'month',
              },
            });
            
            checkoutItems.push({
              price: testPrice.id,
              quantity: 1,
            });
          }
        } else {
          // For any other input, use basic plan as fallback
          console.log(`Unrecognized priceId format: ${priceId}, using fallback test plan`);
          
          // Check if a test price already exists for the basic plan
          const prices = await stripe.prices.list({
            limit: 1,
            active: true,
            lookup_keys: ['basic_test_plan'],
          });
          
          let testPrice;
          if (prices.data.length > 0) {
            testPrice = prices.data[0];
          } else {
            // Create test product and price if it doesn't exist
            const testProduct = await stripe.products.create({
              name: 'Plano Básico (Test)',
              description: 'Plano de teste - até 100 processamentos por dia',
              active: true,
            });
            
            testPrice = await stripe.prices.create({
              product: testProduct.id,
              unit_amount: 990, // R$9.90
              currency: 'brl',
              recurring: {
                interval: 'month',
              },
              lookup_key: 'basic_test_plan',
            });
          }
          
          checkoutItems.push({
            price: testPrice.id,
            quantity: 1,
          });
        }

        // Setup checkout session parameters with optimized performance parameters
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

        return new Response(
          JSON.stringify({ url: session.url }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-prices': {
        console.log('Fetching prices from Stripe');
        
        // Se não temos produtos de assinatura no Stripe ainda, criamos eles
        const products = await stripe.products.list({ active: true });
        
        if (products.data.length === 0) {
          console.log('No products found. Creating default subscription products...');
          
          // Criar produto para o Plano Básico
          const basicProduct = await stripe.products.create({
            name: 'Plano Básico',
            description: 'Até 100 processamentos por dia',
            metadata: {
              limit: 'Até 100 processamentos por dia',
              features: 'Suporte por email,Acesso a todas as funcionalidades básicas'
            }
          });
          
          console.log(`Created basic product: ${basicProduct.id}`);
          
          // Criar preço para o Plano Básico (R$9,90/mês)
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
          
          // Criar produto para o Plano Avançado
          const advancedProduct = await stripe.products.create({
            name: 'Plano Avançado',
            description: 'Processamentos ilimitados',
            metadata: {
              limit: 'Processamentos ilimitados',
              features: 'Suporte prioritário,Acesso a todas as funcionalidades,Sem restrições de uso'
            }
          });
          
          console.log(`Created advanced product: ${advancedProduct.id}`);
          
          // Criar preço para o Plano Avançado (R$15,90/mês)
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
