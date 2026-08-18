import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import Appointments from "./pages/Appointments";
import Clinical from "./pages/Clinical";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Insurance from "./pages/Insurance";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import SettingsPage from "./pages/SettingsPage";
import AccessDenied from "./pages/AccessDenied";

function ModuleRoute({
  path,
  moduleId,
  component: Component,
}: {
  path: string;
  moduleId: string;
  component: React.ComponentType;
}) {
  return (
    <Route path={path}>
      {() => <ModuleGate moduleId={moduleId}>{() => <Component />}</ModuleGate>}
    </Route>
  );
}

function ModuleGate({
  moduleId,
  children,
}: {
  moduleId: string;
  children: () => React.ReactNode;
}) {
  // Lazy import to keep bundle splitting clean; canAccess check is done here.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { canAccessCheck } = useModuleGate(moduleId);
  if (!canAccessCheck) return <AccessDenied moduleId={moduleId} />;
  return <DashboardLayout>{children()}</DashboardLayout>;
}

// Shared helper — imported lazily in ModuleGate; keep simple synchronous check.
import { useCurrentRole, canAccess } from "./lib/roles";

function useModuleGate(moduleId: string) {
  const role = useCurrentRole();
  return { canAccessCheck: canAccess(role, moduleId) };
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <ModuleRoute path="/patients" moduleId="patients" component={Patients} />
      <Route path="/patients/:id">
        {params => <ModuleGate moduleId="patients">{() => <PatientDetail id={Number(params.id)} />}</ModuleGate>}
      </Route>
      <ModuleRoute path="/appointments" moduleId="appointments" component={Appointments} />
      <ModuleRoute path="/clinical" moduleId="clinical" component={Clinical} />
      <ModuleRoute path="/billing" moduleId="billing" component={Billing} />
      <ModuleRoute path="/inventory" moduleId="inventory" component={Inventory} />
      <ModuleRoute path="/insurance" moduleId="insurance" component={Insurance} />
      <ModuleRoute path="/reports" moduleId="reports" component={Reports} />
      <ModuleRoute path="/users" moduleId="users" component={Users} />
      <ModuleRoute path="/settings" moduleId="settings" component={SettingsPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
