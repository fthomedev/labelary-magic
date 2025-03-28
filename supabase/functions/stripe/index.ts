
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
    // Configurando o cliente Stripe
    const { action, ...data } = await req.json();
    console.log(`Stripe function called with action: ${action}`, data);
    
    // Usar a chave de teste fornecida
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || 'sk_test_51R6iAqBLaDKP56zdyAArtHj8Sd2Fxfr66bizL0NHFxOJtlaOOE6jBJgDEHbgXLlFIgBpIysSQZOrOho1FeW6E2RP009ViMszRz';
    
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
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

        // Preparar os itens para o checkout
        let checkoutItems = [];
        
        if (priceId === 'basic' || priceId === 'prod_S109EaoLA02QYK') {
          // Plano básico (usando o ID de produto fornecido ou o nome "basic")
          console.log('Using test mode basic plan');
          try {
            // Verificar se já existe um preço de teste para o plano básico
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
              // Criar produto e preço de teste se não existir
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
          // Plano avançado (usando o ID de produto fornecido ou o nome "advanced")
          console.log('Using test mode advanced plan');
          try {
            // Verificar se já existe um preço de teste para o plano avançado
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
              // Criar produto e preço de teste se não existir
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
          // Se já é um ID de preço válido, usar diretamente
          checkoutItems.push({
            price: priceId,
            quantity: 1,
          });
        } else if (priceId.startsWith('prod_')) {
          // Se for ID de produto, tentar encontrar um preço associado
          try {
            const prices = await stripe.prices.list({
              product: priceId,
              active: true,
              limit: 1,
            });
            
            if (prices.data.length === 0) {
              // Se não encontrar preços no modo teste para esse produto, criar um
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
            
            // Criar um produto de teste alternativo em caso de erro
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
          // Para qualquer outro input, usar o plano básico como fallback
          console.log(`Unrecognized priceId format: ${priceId}, using fallback test plan`);
          
          // Verificar se já existe um preço de teste para o plano básico
          const prices = await stripe.prices.list({
            limit: 1,
            active: true,
            lookup_keys: ['basic_test_plan'],
          });
          
          let testPrice;
          if (prices.data.length > 0) {
            testPrice = prices.data[0];
          } else {
            // Criar produto e preço de teste se não existir
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

        // Parâmetros para a sessão de checkout
        const params = {
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: checkoutItems,
          success_url: successUrl,
          cancel_url: cancelUrl,
        };

        // Adiciona o cliente se fornecido
        if (customerId) {
          params.customer = customerId;
          console.log(`Using existing customer ID: ${customerId}`);
        }

        // Cria a sessão de checkout
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
