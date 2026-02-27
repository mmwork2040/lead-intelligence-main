import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leads = lazy(() => import("./pages/Leads"));
const LeadProfile = lazy(() => import("./pages/LeadProfile"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Surveys = lazy(() => import("./pages/Surveys"));
const CRM = lazy(() => import("./pages/CRM"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const ProductsAndCampaigns = lazy(() => import("./pages/ProductsAndCampaigns"));
const Financial = lazy(() => import("./pages/Financial"));
const Reports = lazy(() => import("./pages/Reports"));
const TrafficReports = lazy(() => import("./pages/TrafficReports"));
const Integrations = lazy(() => import("./pages/Integrations"));
const LinkTracking = lazy(() => import("./pages/LinkTracking"));
const Settings = lazy(() => import("./pages/Settings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const Funnels = lazy(() => import("./pages/Funnels"));
const FunnelDetails = lazy(() => import("./pages/FunnelDetails"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <DemoProvider>
              <AuthProvider>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/pending-approval" element={<PendingApproval />} />

                    {/* Protected Routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/leads" element={<ProtectedRoute><ErrorBoundary><Leads /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/leads/:id" element={<ProtectedRoute><ErrorBoundary><LeadProfile /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/products-campaigns" element={<ProtectedRoute><ErrorBoundary><ProductsAndCampaigns /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/funnels" element={<ProtectedRoute><ErrorBoundary><Funnels /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/funnels/:id" element={<ProtectedRoute><ErrorBoundary><FunnelDetails /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/surveys" element={<ProtectedRoute><ErrorBoundary><Surveys /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/crm" element={<ProtectedRoute><ErrorBoundary><CRM /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/products/:slug" element={<ProtectedRoute><ErrorBoundary><ProductDetails /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/financial" element={<ProtectedRoute><ErrorBoundary><Financial /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/traffic-reports" element={<ProtectedRoute><ErrorBoundary><TrafficReports /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/link-tracking" element={<ProtectedRoute><ErrorBoundary><LinkTracking /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><ErrorBoundary><Settings /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute><ErrorBoundary><UserManagement /></ErrorBoundary></ProtectedRoute>} />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AuthProvider>
            </DemoProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
