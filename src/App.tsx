import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ManagerPage from "./pages/ManagerPage";
import OrderPage from "./pages/OrderPage";
import OrdersPage from "./pages/OrdersPage";
import Menu from "./pages/MenuPage";
import PurchagePage from "./pages/PurchagePage";
import IngredientsPage from "./pages/IngredientsPage";
import MenuIngredientsPage from "./pages/MenuIngredientsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/ingredient" element={<IngredientsPage />} />
          <Route path="/ingredients" element={<MenuIngredientsPage />} />
          <Route
            path="/menu/:menuId/ingredients"
            element={<MenuIngredientsPage />}
          />
          <Route path="/menu" element={<Menu />} />
          <Route path="/purchase" element={<PurchagePage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
