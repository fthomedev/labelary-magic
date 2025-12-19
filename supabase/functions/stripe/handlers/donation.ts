import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "../utils/cors.ts";

const DONATION_AMOUNTS = [500, 1000, 2500, 5000]; // R$5, R$10, R$25, R$50 in cents

export async function handleCreateDonationSession(
  stripe: Stripe,
  data: { amount: number; successUrl?: string; cancelUrl?: string }
) {
  try {
    const { amount, successUrl, cancelUrl } = data;
    
    console.log('Creating donation session for amount:', amount);
    
    // Validate amount
    if (!DONATION_AMOUNTS.includes(amount)) {
      console.error('Invalid donation amount:', amount);
      return new Response(
        JSON.stringify({ error: 'Invalid donation amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a one-time payment checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Doação ZPL Easy',
              description: 'Obrigado por apoiar o projeto!',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${Deno.env.get('SITE_URL') || 'https://zpleasy.com'}/donation/success`,
      cancel_url: cancelUrl || `${Deno.env.get('SITE_URL') || 'https://zpleasy.com'}/app`,
    });

    console.log('Donation session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating donation session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
