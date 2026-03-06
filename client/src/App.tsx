import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import AdminLayout from "@/pages/admin/layout";
import DashboardPage from "@/pages/admin/dashboard";
import BookingsPage from "@/pages/admin/bookings";
import POSPage from "@/pages/admin/pos";
import ServicesPage from "@/pages/admin/services-page";
import BarbersPage from "@/pages/admin/barbers";
import ProductsPage from "@/pages/admin/products-page";
import ExpensesPage from "@/pages/admin/expenses";
import ReportsPage from "@/pages/admin/reports";
import GalleryPage from "@/pages/admin/gallery-page";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/admin">{() => <AdminRoute component={DashboardPage} />}</Route>
      <Route path="/admin/bookings">{() => <AdminRoute component={BookingsPage} />}</Route>
      <Route path="/admin/pos">{() => <AdminRoute component={POSPage} />}</Route>
      <Route path="/admin/services">{() => <AdminRoute component={ServicesPage} />}</Route>
      <Route path="/admin/barbers">{() => <AdminRoute component={BarbersPage} />}</Route>
      <Route path="/admin/products">{() => <AdminRoute component={ProductsPage} />}</Route>
      <Route path="/admin/expenses">{() => <AdminRoute component={ExpensesPage} />}</Route>
      <Route path="/admin/reports">{() => <AdminRoute component={ReportsPage} />}</Route>
      <Route path="/admin/gallery">{() => <AdminRoute component={GalleryPage} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
