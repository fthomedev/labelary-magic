import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { SEO } from '@/components/SEO';
import { Footer } from '@/components/Footer';
import { calculateShopee, type ShopeeInput } from '@/utils/shopeeCalculator';

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ShopeeCalculator = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [salePrice, setSalePrice] = useState('');
  const [productCost, setProductCost] = useState('');
  const [sellerType, setSellerType] = useState<'cnpj' | 'cpf'>('cnpj');
  const [taxRate, setTaxRate] = useState('0');
  const [packagingCost, setPackagingCost] = useState('0');
  const [isFeaturedCampaign, setIsFeaturedCampaign] = useState(false);
  const [exceededCpfOrders, setExceededCpfOrders] = useState(false);

  const input: ShopeeInput = useMemo(() => ({
    salePrice: parseFloat(salePrice) || 0,
    productCost: parseFloat(productCost) || 0,
    sellerType,
    taxRate: parseFloat(taxRate) || 0,
    packagingCost: parseFloat(packagingCost) || 0,
    isFeaturedCampaign,
    exceededCpfOrders,
  }), [salePrice, productCost, sellerType, taxRate, packagingCost, isFeaturedCampaign, exceededCpfOrders]);

  const result = useMemo(() => calculateShopee(input), [input]);
  const hasPrice = input.salePrice > 0;

  const marginColor = {
    green: 'text-emerald-600 dark:text-emerald-400',
    yellow: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
  }[result.marginLevel];

  const marginBg = {
    green: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700',
    yellow: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
    red: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  }[result.marginLevel];

  const MarginIcon = result.marginLevel === 'green' ? TrendingUp : result.marginLevel === 'yellow' ? Minus : TrendingDown;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <SEO
        title="Calculadora Shopee 2026 – ZPL Easy"
        description="Calcule seu lucro na Shopee com as novas taxas de março 2026."
      />

      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex h-14 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-500" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('shopeeCalc.title')}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow py-4 md:py-6">
        <div className="mx-auto max-w-3xl px-4 space-y-4">
          {/* Inputs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('shopeeCalc.inputTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="salePrice">{t('shopeeCalc.salePrice')} *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      id="salePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      className="pl-9"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="productCost">{t('shopeeCalc.productCost')}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      id="productCost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      className="pl-9"
                      value={productCost}
                      onChange={(e) => setProductCost(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('shopeeCalc.sellerType')}</Label>
                <RadioGroup
                  value={sellerType}
                  onValueChange={(v) => setSellerType(v as 'cpf' | 'cnpj')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cnpj" id="cnpj" />
                    <Label htmlFor="cnpj" className="cursor-pointer font-normal">CNPJ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cpf" id="cpf" />
                    <Label htmlFor="cpf" className="cursor-pointer font-normal">CPF</Label>
                  </div>
                </RadioGroup>
              </div>

              {sellerType === 'cpf' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exceededOrders"
                    checked={exceededCpfOrders}
                    onCheckedChange={(c) => setExceededCpfOrders(!!c)}
                  />
                  <Label htmlFor="exceededOrders" className="cursor-pointer text-sm font-normal">
                    {t('shopeeCalc.exceededOrders')}
                  </Label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="taxRate">{t('shopeeCalc.taxRate')}</Label>
                  <div className="relative">
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="packaging">{t('shopeeCalc.packagingCost')}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      id="packaging"
                      type="number"
                      min="0"
                      step="0.01"
                      value={packagingCost}
                      onChange={(e) => setPackagingCost(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="campaign"
                  checked={isFeaturedCampaign}
                  onCheckedChange={(c) => setIsFeaturedCampaign(!!c)}
                />
                <Label htmlFor="campaign" className="cursor-pointer text-sm font-normal">
                  {t('shopeeCalc.featuredCampaign')}
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {hasPrice && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('shopeeCalc.resultTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label={t('shopeeCalc.commission', { pct: result.commissionPercent.toFixed(0) })} value={`-${formatBRL(result.commissionValue)}`} negative />
                <Row label={t('shopeeCalc.fixedFee')} value={`-${formatBRL(result.fixedFee)}`} negative />
                {result.campaignFee > 0 && (
                  <Row label={t('shopeeCalc.campaignFeeLabel')} value={`-${formatBRL(result.campaignFee)}`} negative />
                )}
                {result.pixSubsidy > 0 && (
                  <Row label={t('shopeeCalc.pixSubsidy')} value={`+${formatBRL(result.pixSubsidy)}`} positive />
                )}
                {result.cpfExtraFee > 0 && (
                  <Row label={t('shopeeCalc.cpfExtraFee')} value={`-${formatBRL(result.cpfExtraFee)}`} negative />
                )}
                {result.taxValue > 0 && (
                  <Row label={t('shopeeCalc.tax')} value={`-${formatBRL(result.taxValue)}`} negative />
                )}
                {result.packagingCost > 0 && (
                  <Row label={t('shopeeCalc.packaging')} value={`-${formatBRL(result.packagingCost)}`} negative />
                )}

                <Separator />

                <div className="flex justify-between items-center font-semibold">
                  <span className="text-gray-900 dark:text-white">{t('shopeeCalc.netValue')}</span>
                  <span className="text-gray-900 dark:text-white">{formatBRL(result.netValue)}</span>
                </div>

                {input.productCost > 0 && (
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-gray-900 dark:text-white">{t('shopeeCalc.profit')}</span>
                    <span className={marginColor}>{formatBRL(result.profit)}</span>
                  </div>
                )}

                <div className={`flex justify-between items-center p-3 rounded-lg border ${marginBg}`}>
                  <div className="flex items-center gap-2">
                    <MarginIcon className={`h-5 w-5 ${marginColor}`} />
                    <span className="font-semibold text-gray-900 dark:text-white">{t('shopeeCalc.margin')}</span>
                  </div>
                  <span className={`text-lg font-bold ${marginColor}`}>
                    {result.profitMargin.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fee table reference */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('shopeeCalc.feeTableTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">{t('shopeeCalc.priceRange')}</th>
                      <th className="pb-2 pr-4">{t('shopeeCalc.commissionCol')}</th>
                      <th className="pb-2">{t('shopeeCalc.pixSubsidyCol')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-300">
                    <tr className="border-b"><td className="py-1.5 pr-4">Até R$ 79,99</td><td className="pr-4">20% + R$ 4,00</td><td>—</td></tr>
                    <tr className="border-b"><td className="py-1.5 pr-4">R$ 80 – R$ 99,99</td><td className="pr-4">14% + R$ 16,00</td><td>5%</td></tr>
                    <tr className="border-b"><td className="py-1.5 pr-4">R$ 100 – R$ 199,99</td><td className="pr-4">14% + R$ 20,00</td><td>5%</td></tr>
                    <tr className="border-b"><td className="py-1.5 pr-4">R$ 200 – R$ 499,99</td><td className="pr-4">14% + R$ 26,00</td><td>5%</td></tr>
                    <tr><td className="py-1.5 pr-4">Acima de R$ 500</td><td className="pr-4">14% + R$ 28,00</td><td>8%</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {t('shopeeCalc.feeTableNote')}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const Row = ({ label, value, negative, positive }: { label: string; value: string; negative?: boolean; positive?: boolean }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={positive ? 'text-emerald-600 dark:text-emerald-400' : negative ? 'text-red-500 dark:text-red-400' : ''}>
      {value}
    </span>
  </div>
);

export default ShopeeCalculator;
