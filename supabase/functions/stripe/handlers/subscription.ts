
import Stripe from "https://esm.sh/stripe@12.18.0";
import { corsHeaders } from "../utils/cors.ts";

// Get customer subscription
export async function getCustomerSubscription(stripe: Stripe, customerId: string) {
  if (!customerId) {
    throw new Error('Customer ID is required');
  }

  console.log(`Fetching subscriptions for customer: ${customerId}`);
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    expand: ['data.default_payment_method'],
  });

  console.log(`Found ${subscriptions.data.length} active subscriptions`);
  return subscriptions.data;
}

// Handler for get-customer-subscription action
export async function handleGetCustomerSubscription(stripe: Stripe, data: any) {
  try {
    const subscriptions = await getCustomerSubscription(stripe, data.customerId);
    return new Response(
      JSON.stringify(subscriptions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching customer subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
