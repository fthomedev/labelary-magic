import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO } from '@/components/SEO';

const DonationSuccess = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEO 
        title={t('donationSuccessTitle')}
        description={t('donationThankYouMessage')}
      />
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            </div>
            <CardTitle className="text-2xl">{t('donationSuccessTitle')}</CardTitle>
            <CardDescription className="text-base">
              {t('donationThankYouMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('donationImpactMessage')}
            </p>
            <Button asChild className="w-full">
              <Link to="/app">
                {t('goToDashboard')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DonationSuccess;
