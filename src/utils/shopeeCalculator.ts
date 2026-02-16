export interface ShopeeInput {
  salePrice: number;
  productCost: number;
  sellerType: 'cpf' | 'cnpj';
  taxRate: number; // percentage
  packagingCost: number;
  isFeaturedCampaign: boolean;
  exceededCpfOrders: boolean; // CPF sellers with >450 orders in 90 days
}

export interface ShopeeResult {
  commissionPercent: number;
  commissionValue: number;
  fixedFee: number;
  campaignFee: number;
  pixSubsidy: number;
  cpfExtraFee: number;
  taxValue: number;
  packagingCost: number;
  totalFees: number;
  netValue: number;
  profit: number;
  profitMargin: number;
  marginLevel: 'green' | 'yellow' | 'red';
}

interface FeeRange {
  commissionPercent: number;
  fixedFee: number;
  pixSubsidyPercent: number;
}

function getFeeRange(price: number): FeeRange {
  if (price <= 79.99) {
    return { commissionPercent: 20, fixedFee: 4, pixSubsidyPercent: 0 };
  } else if (price <= 99.99) {
    return { commissionPercent: 14, fixedFee: 16, pixSubsidyPercent: 5 };
  } else if (price <= 199.99) {
    return { commissionPercent: 14, fixedFee: 20, pixSubsidyPercent: 5 };
  } else if (price <= 499.99) {
    return { commissionPercent: 14, fixedFee: 26, pixSubsidyPercent: 5 };
  } else {
    return { commissionPercent: 14, fixedFee: 28, pixSubsidyPercent: 8 };
  }
}

export function calculateShopee(input: ShopeeInput): ShopeeResult {
  const { salePrice, productCost, sellerType, taxRate, packagingCost, isFeaturedCampaign, exceededCpfOrders } = input;

  if (salePrice <= 0) {
    return {
      commissionPercent: 0, commissionValue: 0, fixedFee: 0, campaignFee: 0,
      pixSubsidy: 0, cpfExtraFee: 0, taxValue: 0, packagingCost: 0,
      totalFees: 0, netValue: 0, profit: 0, profitMargin: 0, marginLevel: 'red',
    };
  }

  const range = getFeeRange(salePrice);

  const commissionPercent = range.commissionPercent;
  const commissionValue = salePrice * (commissionPercent / 100);
  const fixedFee = range.fixedFee;

  // Featured campaign adds 2.5% on top
  const campaignFee = isFeaturedCampaign ? salePrice * 0.025 : 0;

  // Pix subsidy (credit back to seller)
  const pixSubsidy = salePrice * (range.pixSubsidyPercent / 100);

  // CPF extra fee if >450 orders in 90 days
  const cpfExtraFee = sellerType === 'cpf' && exceededCpfOrders ? 3 : 0;

  // Tax on sale price
  const taxValue = salePrice * (taxRate / 100);

  // Total deductions
  const totalFees = commissionValue + fixedFee + campaignFee + cpfExtraFee + taxValue + packagingCost - pixSubsidy;

  const netValue = salePrice - totalFees;
  const profit = netValue - productCost;
  const profitMargin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

  let marginLevel: 'green' | 'yellow' | 'red';
  if (profitMargin > 15) marginLevel = 'green';
  else if (profitMargin >= 5) marginLevel = 'yellow';
  else marginLevel = 'red';

  return {
    commissionPercent,
    commissionValue,
    fixedFee,
    campaignFee,
    pixSubsidy,
    cpfExtraFee,
    taxValue,
    packagingCost,
    totalFees,
    netValue,
    profit,
    profitMargin,
    marginLevel,
  };
}
