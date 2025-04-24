
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { Footer } from "@/components/Footer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import CheckoutPage from "./pages/CheckoutPage";
import Landing from "./pages/Landing";
import { useEffect } from "react";

// Cliente QueryClient criado fora do componente para evitar re-criação
const queryClient = new QueryClient();

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
        <Route path="/" element={<PageWithFooter><Landing /></PageWithFooter>} />
        <Route path="/auth" element={<PageWithFooter><Auth /></PageWithFooter>} />
        <Route
          path="/app"
          element={
            <AuthGuard>
              <PageWithFooter><Index /></PageWithFooter>
            </AuthGuard>
          }
        />
        <Route
          path="/subscription"
          element={
            <AuthGuard>
              <PageWithFooter><Subscription /></PageWithFooter>
            </AuthGuard>
          }
        />
        <Route
          path="/checkout"
          element={
            <AuthGuard>
              <PageWithFooter><CheckoutPage /></PageWithFooter>
            </AuthGuard>
          }
        />
        <Route
          path="/subscription/success"
          element={
            <AuthGuard>
              <PageWithFooter><SubscriptionSuccess /></PageWithFooter>
            </AuthGuard>
          }
        />
        <Route path="*" element={<PageWithFooter><NotFound /></PageWithFooter>} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
