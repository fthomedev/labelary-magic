
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { Footer } from "@/components/Footer";
import { lazy, Suspense, useEffect } from "react";

// Lazy load pages to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Subscription = lazy(() => import("./pages/Subscription"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const Landing = lazy(() => import("./pages/Landing"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Documentation = lazy(() => import("./pages/Documentation"));
const FAQ = lazy(() => import("./pages/FAQ"));

// Page loading fallback
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-16 w-16 animate-pulse bg-primary/10 rounded-full" />
  </div>
);

// Client created outside to avoid recreation on renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
    }
  }
});

// Layout component to wrap pages with footer
const PageWithFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <div className="flex-grow">{children}</div>
    <Footer />
  </div>
);

// ScrollToTop component to handle scroll position on route change
const ScrollToTop = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ScrollToTop />
      <Routes>
        <Route 
          path="/" 
          element={
            <PageWithFooter>
              <Suspense fallback={<PageLoading />}>
                <Landing />
              </Suspense>
            </PageWithFooter>
          } 
        />
        <Route 
          path="/auth" 
          element={
            <PageWithFooter>
              <Suspense fallback={<PageLoading />}>
                <Auth />
              </Suspense>
            </PageWithFooter>
          } 
        />
        <Route
          path="/app"
          element={
            <AuthGuard>
              <PageWithFooter>
                <Suspense fallback={<PageLoading />}>
                  <Index />
                </Suspense>
              </PageWithFooter>
            </AuthGuard>
          }
        />
        <Route
          path="/subscription"
          element={
            <AuthGuard>
              <PageWithFooter>
                <Suspense fallback={<PageLoading />}>
                  <Subscription />
                </Suspense>
              </PageWithFooter>
            </AuthGuard>
          }
        />
        <Route
          path="/pricing"
          element={
            <PageWithFooter>
              <Suspense fallback={<PageLoading />}>
                <Pricing />
              </Suspense>
            </PageWithFooter>
          }
        />
        <Route
          path="/docs"
          element={
            <PageWithFooter>
              <Suspense fallback={<PageLoading />}>
                <Documentation />
              </Suspense>
            </PageWithFooter>
          }
        />
        <Route
          path="/faq"
          element={
            <PageWithFooter>
              <Suspense fallback={<PageLoading />}>
                <FAQ />
              </Suspense>
            </PageWithFooter>
          }
        />
        <Route
          path="/checkout"
          element={
            <AuthGuard>
              <PageWithFooter>
                <Suspense fallback={<PageLoading />}>
                  <CheckoutPage />
                </Suspense>
              </PageWithFooter>
            </AuthGuard>
          }
        />
        <Route
          path="/subscription/success"
          element={
            <AuthGuard>
              <PageWithFooter>
                <Suspense fallback={<PageLoading />}>
                  <SubscriptionSuccess />
                </Suspense>
              </PageWithFooter>
            </AuthGuard>
          }
        />
        <Route 
          path="*" 
          element={
            <PageWithFooter>
              <Suspense fallback={<PageLoading />}>
                <NotFound />
              </Suspense>
            </PageWithFooter>
          } 
        />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
