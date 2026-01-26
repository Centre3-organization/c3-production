import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./theme/ThemeContext";

// Layouts
import Layout from "./layouts/Layout";

// Auth Module
import Login from "./modules/auth/Login";
import AccessDenied from "./modules/auth/AccessDenied";
import NotFound from "./modules/auth/NotFound";
import Profile from "./modules/auth/Profile";

// Dashboard Module
import Dashboard from "./modules/dashboard/Dashboard";
import Reports from "./modules/dashboard/Reports";

// Requests Module
import RequestList from "./modules/requests/RequestList";
import RequestForm from "./modules/requests/RequestForm";

// Approvals Module
import L1Approval from "./modules/approvals/L1Approval";
import L2Approval from "./modules/approvals/L2Approval";

// Facilities Module
import Sites from "./modules/facilities/Sites";
import Zones from "./modules/facilities/Zones";
import Areas from "./modules/facilities/Areas";
import ViewSite from "./modules/facilities/ViewSite";

// Security Module
import GlobalOverwatch from "./modules/security/GlobalOverwatch";
import SecurityAlerts from "./modules/security/SecurityAlerts";

// Users Module
import Users from "./modules/users/Users";

// Groups Module
import Groups from "./modules/groups/Groups";

// Workflows Module
import { WorkflowBuilder } from "./modules/workflows/WorkflowBuilder";
import { ShiftManagement } from "./modules/workflows/ShiftManagement";
import { DelegationManagement } from "./modules/workflows/DelegationManagement";

// Settings Module
import Settings from "./modules/settings/Settings";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      <Route path="/access-denied" component={AccessDenied} />
      <Route path="/404" component={NotFound} />
      
      {/* Protected Routes - Dashboard */}
      <Route path="/">
        <Layout>
          <Dashboard />
        </Layout>
      </Route>
      <Route path="/reports">
        <Layout>
          <Reports />
        </Layout>
      </Route>
      
      {/* Protected Routes - Requests */}
      <Route path="/requests">
        <Layout>
          <RequestList />
        </Layout>
      </Route>
      <Route path="/requests/new">
        <Layout>
          <RequestForm />
        </Layout>
      </Route>
      
      {/* Protected Routes - Approvals */}
      <Route path="/approvals/l1">
        <Layout>
          <L1Approval />
        </Layout>
      </Route>
      <Route path="/approvals/l2">
        <Layout>
          <L2Approval />
        </Layout>
      </Route>
      
      {/* Protected Routes - Facilities */}
      <Route path="/sites">
        <Layout>
          <Sites />
        </Layout>
      </Route>
      <Route path="/zones">
        <Layout>
          <Zones />
        </Layout>
      </Route>
      <Route path="/areas">
        <Layout>
          <Areas />
        </Layout>
      </Route>
      <Route path="/sites/:id">
        <Layout>
          <ViewSite />
        </Layout>
      </Route>
      
      {/* Protected Routes - Security */}
      <Route path="/global-overwatch">
        <Layout>
          <GlobalOverwatch />
        </Layout>
      </Route>
      <Route path="/alerts">
        <Layout>
          <SecurityAlerts />
        </Layout>
      </Route>
      
      {/* Protected Routes - Administration */}
      <Route path="/groups">
        <Layout>
          <Groups />
        </Layout>
      </Route>
      <Route path="/users">
        <Layout>
          <Users />
        </Layout>
      </Route>
      <Route path="/settings">
        <Layout>
          <Settings />
        </Layout>
      </Route>
      
      {/* Protected Routes - Workflow Management */}
      <Route path="/workflows">
        <Layout>
          <WorkflowBuilder />
        </Layout>
      </Route>
      <Route path="/shifts">
        <Layout>
          <ShiftManagement />
        </Layout>
      </Route>
      <Route path="/delegations">
        <Layout>
          <DelegationManagement />
        </Layout>
      </Route>
      <Route path="/profile">
        <Layout>
          <Profile />
        </Layout>
      </Route>
      
      {/* Catch-all Route */}
      <Route path="/:rest*">
        {(params) => (
          <Layout>
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <h1 className="text-2xl font-bold mb-2">Page Under Construction</h1>
              <p className="text-muted-foreground">The requested page "{params["rest*"]}" is being built.</p>
            </div>
          </Layout>
        )}
      </Route>
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
