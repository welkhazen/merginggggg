import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StytchProvider } from "@/providers/StytchProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Authenticate from "./pages/Authenticate";
import Admin from "./pages/Admin";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ThemeCustomizer } from "@/components/theme/ThemeCustomizer";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <StytchProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/authenticate" element={<Authenticate />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/dashboard/communities/:communityId" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ThemeCustomizer />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </StytchProvider>
  </ThemeProvider>
);

export default App;
