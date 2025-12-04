
import Stripe from "https://esm.sh/stripe@12.18.0";

// Initialize Stripe using environment variable only
export function initializeStripe() {
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  
  console.log('Stripe client initialized');
  
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    maxNetworkRetries: 3,
  });
}
