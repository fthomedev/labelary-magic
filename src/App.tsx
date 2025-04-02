
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { Footer } from "@/components/Footer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import CheckoutPage from "./pages/CheckoutPage";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

// Layout component to wrap pages with footer
const PageWithFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <div className="flex-grow">{children}</div>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
