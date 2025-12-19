import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature) {
    console.log('No signature found');
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    let event: Stripe.Event;

    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For testing without webhook secret
      event = JSON.parse(body);
      console.log('Warning: No webhook secret configured, parsing body directly');
    }

    console.log(`Received event: ${event.type}`);

    // Handle successful payment (donation)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Only process one-time payments (donations)
      if (session.mode === 'payment' && session.payment_status === 'paid') {
        console.log('Processing donation:', session.id);
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { error } = await supabase.from('donations').insert({
          stripe_payment_intent_id: session.payment_intent as string,
          amount: session.amount_total || 0,
          currency: session.currency || 'brl',
          status: 'completed',
        });

        if (error) {
          console.error('Error inserting donation:', error);
        } else {
          console.log('Donation recorded successfully');
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
});
