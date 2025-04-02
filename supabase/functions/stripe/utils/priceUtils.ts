
import Stripe from "https://esm.sh/stripe@12.18.0";

// Find or create a price for a product
export async function findOrCreatePrice(stripe: Stripe, productId: string, amount: number, currency: string, interval: string) {
  try {
    // Check if a price already exists for the product
    const prices = await stripe.prices.list({
      limit: 1,
      active: true,
      product: productId,
    });
    
    if (prices.data.length > 0) {
      console.log(`Found existing price for product: ${productId}`, prices.data[0].id);
      return prices.data[0];
    }
    
    // Create price if it doesn't exist
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency: currency,
      recurring: {
        interval: interval,
      },
      lookup_key: productId === 'prod_basic_plan' ? 'basic_plan' : 
                 productId === 'prod_advanced_plan' ? 'advanced_plan' : 'unlimited_plan',
      metadata: {
        usage_limit: productId === 'prod_basic_plan' ? '50' : 
                    productId === 'prod_advanced_plan' ? '100' : '-1', // -1 means unlimited
      }
    });
    
    console.log(`Created new price for product ${productId}:`, price.id);
    return price;
  } catch (err) {
    console.error(`Error setting up price for product ${productId}:`, err);
    throw err;
  }
}
