
import Stripe from "https://esm.sh/stripe@12.18.0";

// Initialize Stripe with test mode key
export function initializeStripe() {
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || 'sk_test_51R6iAqBLaDKP56zdyAArtHj8Sd2Fxfr66bizL0NHFxOJtlaOOE6jBJgDEHbgXLlFIgBpIysSQZOrOho1FeW6E2RP009ViMszRz';
  
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  
  console.log('Using Stripe in TEST mode with test key');
  
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    maxNetworkRetries: 3,
  });
}
