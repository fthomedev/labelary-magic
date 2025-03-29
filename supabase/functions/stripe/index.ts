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
    // Configuring Stripe client - always use test mode
    const { action, ...data } = await req.json();
    console.log(`Stripe function called with action: ${action}`, data);
    
    // Explicitly set to test mode using the test key
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || 'sk_test_51R6iAqBLaDKP56zdyAArtHj8Sd2Fxfr66bizL0NHFxOJtlaOOE6jBJgDEHbgXLlFIgBpIysSQZOrOho1FeW6E2RP009ViMszRz';
    console.log('Using Stripe in TEST mode with test key');
    
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      maxNetworkRetries: 3,
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
        
        if (priceId === 'basic' || priceId === 'prod_S1qlt19OAovrSE') {
          // Basic plan with correct product ID
          console.log('Using test mode basic plan with product ID: prod_S1qlt19OAovrSE');
          try {
            // Check if a test price already exists for the basic plan
            const prices = await stripe.prices.list({
              limit: 1,
              active: true,
              product: 'prod_S1qlt19OAovrSE',
            });
            
            let testPrice;
            if (prices.data.length > 0) {
              testPrice = prices.data[0];
              console.log('Found existing test price for basic plan:', testPrice.id);
            } else {
              // Create test price if it doesn't exist
              testPrice = await stripe.prices.create({
                product: 'prod_S1qlt19OAovrSE',
                unit_amount: 990, // R$9.90
                currency: 'brl',
                recurring: {
                  interval: 'month',
                },
                lookup_key: 'basic_test_plan',
              });
              console.log('Created new test price for basic plan:', testPrice.id);
            }
            
            checkoutItems.push({
              price: testPrice.id,
              quantity: 1,
            });
          } catch (err) {
            console.error('Error setting up test price for basic plan:', err);
            throw err;
          }
        } else if (priceId === 'advanced' || priceId === 'prod_S1qmbByFFnRUaT') {
          // Advanced plan with correct product ID
          console.log('Using test mode advanced plan with product ID: prod_S1qmbByFFnRUaT');
          try {
            // Check if a test price already exists for the advanced plan
            const prices = await stripe.prices.list({
              limit: 1,
              active: true,
              product: 'prod_S1qmbByFFnRUaT',
            });
            
            let testPrice;
            if (prices.data.length > 0) {
              testPrice = prices.data[0];
              console.log('Found existing test price for advanced plan:', testPrice.id);
            } else {
              // Create test price if it doesn't exist
              testPrice = await stripe.prices.create({
                product: 'prod_S1qmbByFFnRUaT',
                unit_amount: 1590, // R$15.90
                currency: 'brl',
                recurring: {
                  interval: 'month',
                },
                lookup_key: 'advanced_test_plan',
              });
              console.log('Created new test price for advanced plan:', testPrice.id);
            }
            
            checkoutItems.push({
              price: testPrice.id,
              quantity: 1,
            });
          } catch (err) {
            console.error('Error setting up test price for advanced plan:', err);
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
              // If no prices found for this product, fallback to basic plan
              console.log(`No active prices found for product: ${priceId}, falling back to basic plan`);
              
              const basicPrices = await stripe.prices.list({
                product: 'prod_S1qlt19OAovrSE',
                active: true,
                limit: 1,
              });
              
              if (basicPrices.data.length > 0) {
                checkoutItems.push({
                  price: basicPrices.data[0].id,
                  quantity: 1,
                });
              } else {
                // Create a new price if none exists
                const testPrice = await stripe.prices.create({
                  product: 'prod_S1qlt19OAovrSE',
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
              checkoutItems.push({
                price: prices.data[0].id,
                quantity: 1,
              });
            }
          } catch (error) {
            console.error('Error finding price for product:', error);
            // Fallback to basic plan on error
            const basicPrices = await stripe.prices.list({
              product: 'prod_S1qlt19OAovrSE',
              active: true,
              limit: 1,
            });
            
            if (basicPrices.data.length > 0) {
              checkoutItems.push({
                price: basicPrices.data[0].id,
                quantity: 1,
              });
            } else {
              const testPrice = await stripe.prices.create({
                product: 'prod_S1qlt19OAovrSE',
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
          }
        } else {
          // For any unrecognized input, fallback to basic plan
          console.log(`Unrecognized priceId format: ${priceId}, using basic plan fallback`);
          
          // Check if a price exists for the basic plan
          const prices = await stripe.prices.list({
            product: 'prod_S1qlt19OAovrSE',
            active: true,
            limit: 1,
          });
          
          if (prices.data.length > 0) {
            checkoutItems.push({
              price: prices.data[0].id,
              quantity: 1,
            });
          } else {
            // Create a new price if none exists
            const testPrice = await stripe.prices.create({
              product: 'prod_S1qlt19OAovrSE',
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
        }

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
          
          // Criar produto para o Plano Básico com ID correto
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
          
          // Criar produto para o Plano Avançado com ID correto
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
