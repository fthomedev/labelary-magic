
export type SubscriptionPlan = {
  id: string;
  product: {
    id: string;
    name: string;
    description: string;
    images: string[];
    metadata: Record<string, string>;
  };
  unit_amount: number;
  currency: string;
  recurring: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
  metadata: Record<string, string>;
  nickname: string;
};

export interface StripeCustomer {
  id: string;
  email: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      price: {
        id: string;
        product: {
          id: string;
          name: string;
        };
        unit_amount: number;
        currency: string;
        recurring: {
          interval: string;
          interval_count: number;
        };
      };
    }>;
  };
}
