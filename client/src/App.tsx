import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { LanguageProvider } from "./contexts/LanguageContext"; // Import LanguageProvider

import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ChildrenList from "@/pages/ChildrenList";
import PregnantWomenList from "@/pages/PregnantWomenList";
import Camps from "@/pages/Camps";
import NotFound from "@/pages/not-found";
import RegisterHousehold from "@/pages/RegisterHousehold"; // Import the new component
import LookupHousehold from "@/pages/LookupHousehold"; // Import the new component

// Import new Child CRUD components
import AddChild from "@/pages/children/AddChild";
import EditChild from "@/pages/children/EditChild";
import ViewChild from "@/pages/children/ViewChild";

// Import new Pregnant Woman CRUD components
import AddPregnantWoman from "@/pages/pregnant-women/AddPregnantWoman";
import EditPregnantWoman from "@/pages/pregnant-women/EditPregnantWoman";
import ViewPregnantWoman from "@/pages/pregnant-women/ViewPregnantWoman";

// Import new Bulk Data Management components
import BulkImport from "@/pages/BulkImport";
import BulkExport from "@/pages/BulkExport";

// Import AdminSettings component
import AdminSettings from "@/pages/AdminSettings";

// Import User components
import ViewUser from "@/pages/users/ViewUser";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (!user) {
    setLocation("/login");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={RegisterHousehold} />
        <Route path="/lookup" component={LookupHousehold} />
        
        {/* Protected Admin Routes */}
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/children">
          <ProtectedRoute component={ChildrenList} />
        </Route>
        {/* New Child CRUD Routes */}
        <Route path="/children/add">
          <ProtectedRoute component={AddChild} />
        </Route>
        <Route path="/children/:id">
          <ProtectedRoute component={ViewChild} />
        </Route>
        <Route path="/children/:id/edit">
          <ProtectedRoute component={EditChild} />
        </Route>

        <Route path="/pregnant-women">
          <ProtectedRoute component={PregnantWomenList} />
        </Route>
        {/* New Pregnant Woman CRUD Routes */}
        <Route path="/pregnant-women/add">
          <ProtectedRoute component={AddPregnantWoman} />
        </Route>
        <Route path="/pregnant-women/:id">
          <ProtectedRoute component={ViewPregnantWoman} />
        </Route>
        <Route path="/pregnant-women/:id/edit">
          <ProtectedRoute component={EditPregnantWoman} />
        </Route>

        <Route path="/camps">
          <ProtectedRoute component={Camps} />
        </Route>
        <Route path="/bulk-import">
          <ProtectedRoute component={BulkImport} />
        </Route>
        <Route path="/bulk-export">
          <ProtectedRoute component={BulkExport} />
        </Route>
        <Route path="/settings">
          <ProtectedRoute component={AdminSettings} />
        </Route>
        <Route path="/users/:id">
          <ProtectedRoute component={ViewUser} />
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Router />
        </LanguageProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
