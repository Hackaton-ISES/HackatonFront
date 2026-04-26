import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Loader } from "@/components/common/Loader";

const Login = lazy(() => import("./pages/Login"));
const RegisterCompany = lazy(() => import("./pages/RegisterCompany"));
const CompanyDashboard = lazy(() => import("./pages/company/CompanyDashboard"));
const MyApplications = lazy(() => import("./pages/company/MyApplications"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminTendersPage = lazy(() => import("./pages/admin/AdminTendersPage"));
const AdminCompaniesPage = lazy(() => import("./pages/admin/AdminCompaniesPage"));
const AdminTenderDetails = lazy(() => import("./pages/admin/AdminTenderDetails"));
const AdminCreateTender = lazy(() => import("./pages/admin/AdminCreateTender"));
const AdminEditTender = lazy(() => import("./pages/admin/AdminEditTender"));
const CompanyProfilePage = lazy(() => import("./pages/CompanyProfilePage"));
const PublicTransparencyPage = lazy(() => import("./pages/PublicTransparencyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/company"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <Loader label="Sahifa yuklanmoqda..." />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/public" element={<PublicTransparencyPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterCompany />} />

              {/* Authenticated routes share the navbar layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  {/* Company */}
                  <Route element={<ProtectedRoute role="company" />}>
                    <Route path="/company" element={<CompanyDashboard />} />
                    <Route path="/company/applications" element={<MyApplications />} />
                  </Route>

                  {/* Admin */}
                  <Route element={<ProtectedRoute role="admin" />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/tenders" element={<AdminTendersPage />} />
                    <Route path="/admin/companies" element={<AdminCompaniesPage />} />
                    <Route path="/admin/tenders/create" element={<AdminCreateTender />} />
                    <Route path="/admin/tenders/:id" element={<AdminTenderDetails />} />
                    <Route path="/admin/tenders/:id/edit" element={<AdminEditTender />} />
                  </Route>

                  {/* Shared (admin + company) */}
                  <Route path="/companies/:companyId" element={<CompanyProfilePage />} />
                </Route>
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
