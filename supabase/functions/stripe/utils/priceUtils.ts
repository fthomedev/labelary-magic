
import Stripe from "https://esm.sh/stripe@12.18.0";

// Find or create a price for a product
export async function findOrCreatePrice(stripe: Stripe, productId: string, amount: number, currency: string, interval: string) {
  try {
    // Check if a test price already exists for the product
    const prices = await stripe.prices.list({
      limit: 1,
      active: true,
      product: productId,
    });
    
    if (prices.data.length > 0) {
      console.log(`Found existing test price for product: ${productId}`, prices.data[0].id);
      return prices.data[0];
    }
    
    // Create test price if it doesn't exist
    const testPrice = await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency: currency,
      recurring: {
        interval: interval,
      },
      lookup_key: productId === 'prod_S1qlt19OAovrSE' ? 'basic_test_plan' : 'advanced_test_plan',
    });
    
    console.log(`Created new test price for product ${productId}:`, testPrice.id);
    return testPrice;
  } catch (err) {
    console.error(`Error setting up test price for product ${productId}:`, err);
    throw err;
  }
}
