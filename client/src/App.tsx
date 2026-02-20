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

// Requests Module
import RequestList from "./modules/requests/RequestList";
import RequestForm from "./modules/requests/RequestForm";
import DynamicRequestForm from "./modules/requests/DynamicRequestForm";

// Approvals Module
import Approvals from "./modules/approvals/Approvals";
import ApprovalHistory from "./modules/approvals/ApprovalHistory";


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

// Administration Module
import Companies from "./modules/administration/Companies";
import MaterialTypes from "./modules/masterdata/MaterialTypes";
import CompanyDetail from "./modules/administration/CompanyDetail";

// Workflows Module
import { WorkflowBuilder } from "./modules/workflows/WorkflowBuilder";
import { DelegationManagement } from "./modules/workflows/DelegationManagement";

// Settings Module
import Settings from "./modules/settings/Settings";
import TranslationManagement from "./modules/settings/TranslationManagement";
import RequestTypeConfig from "./modules/settings/RequestTypeConfig";
import IntegrationHub from "./modules/settings/IntegrationHub";
import CommunicationsIntegration from "./modules/settings/CommunicationsIntegration";

// MCM Module (Magnetic Card Management)
// McmDashboard removed - stats moved to CardDirectory
import CardDirectory from "./modules/mcm/CardDirectory";

// Checkpoint Module - Integrated into Admin Dashboard
import { CheckpointHome } from "./pages/CheckpointHome";
import { CheckpointSearch } from "./pages/CheckpointSearch";
import { CheckpointSettings } from "./pages/CheckpointSettings";
import { AIIntegrations } from "./pages/AIIntegrations";
import { UnregisteredEntry } from "./pages/UnregisteredEntry";
import { FakePassReportForm } from "./pages/FakePassReportForm";
import { IntegrationsDashboard } from "./pages/IntegrationsDashboard";
import { WatchlistDashboard } from "./pages/WatchlistDashboard";
import { IncidentReportHistory } from "./pages/IncidentReportHistory";
import { SecurityAlertConfigPage } from "./pages/SecurityAlertConfig";

// Reports Module
import Reports from "./modules/reports/Reports";
import NewCardRequest from "./modules/mcm/NewCardRequest";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      <Route path="/access-denied" component={AccessDenied} />
      <Route path="/404" component={NotFound} />
      
      {/* Checkpoint Routes - Integrated into Admin Dashboard */}
      <Route path="/checkpoint">
        <Layout>
          <CheckpointHome />
        </Layout>
      </Route>
      <Route path="/checkpoint/search">
        <Layout>
          <CheckpointSearch />
        </Layout>
      </Route>
      <Route path="/checkpoint/settings">
        <Layout>
          <CheckpointSettings />
        </Layout>
      </Route>
      <Route path="/ai-integrations">
        <Layout>
          <AIIntegrations />
        </Layout>
      </Route>
      <Route path="/security-alert-config">
        <Layout>
          <SecurityAlertConfigPage />
        </Layout>
      </Route>
      <Route path="/checkpoint/unregistered-entry">
        <Layout>
          <UnregisteredEntry />
        </Layout>
      </Route>
      <Route path="/checkpoint/fake-pass-report">
        <Layout>
          <FakePassReportForm />
        </Layout>
      </Route>
      
      {/* Protected Routes - Dashboard and Admin Modules */}
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
          <DynamicRequestForm />
        </Layout>
      </Route>
      <Route path="/requests/:id/edit">
        <Layout>
          <DynamicRequestForm />
        </Layout>
      </Route>
      <Route path="/requests/new-legacy">
        <Layout>
          <RequestForm />
        </Layout>
      </Route>
      
      {/* Protected Routes - Approvals */}
      <Route path="/approvals">
        <Layout>
          <Approvals />
        </Layout>
      </Route>

      <Route path="/approvals/history">
        <Layout>
          <ApprovalHistory />
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
      <Route path="/companies/:id">
        <Layout>
          <CompanyDetail />
        </Layout>
      </Route>
      <Route path="/companies">
        <Layout>
          <Companies />
        </Layout>
      </Route>
      <Route path="/material-types">
        <Layout>
          <MaterialTypes />
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
      <Route path="/settings/translations">
        <Layout>
          <TranslationManagement />
        </Layout>
      </Route>
      <Route path="/settings/request-types">
        <Layout>
          <RequestTypeConfig />
        </Layout>
      </Route>
      <Route path="/integration-hub">
        <Layout>
          <IntegrationHub />
        </Layout>
      </Route>
      <Route path="/integration-hub/communications">
        <Layout>
          <CommunicationsIntegration />
        </Layout>
      </Route>
      <Route path="/integration-hub/communications/:tab">
        <Layout>
          <CommunicationsIntegration />
        </Layout>
      </Route>
      <Route path="/checkpoint-integrations">
        <Layout>
          <IntegrationsDashboard />
        </Layout>
      </Route>
      <Route path="/checkpoint/watchlist">
        <Layout>
          <WatchlistDashboard />
        </Layout>
      </Route>
      <Route path="/checkpoint-incidents">
        <Layout>
          <IncidentReportHistory />
        </Layout>
      </Route>
      
      {/* Protected Routes - Workflow Management */}
      <Route path="/workflows">
        <Layout>
          <WorkflowBuilder />
        </Layout>
      </Route>
      <Route path="/delegations">
        <Layout>
          <DelegationManagement />
        </Layout>
      </Route>
      

      
      {/* Protected Routes - MCM (Magnetic Card Management) */}
      <Route path="/mcm">
        <Layout>
          <CardDirectory />
        </Layout>
      </Route>
      <Route path="/mcm/cards">
        <Layout>
          <CardDirectory />
        </Layout>
      </Route>
      <Route path="/mcm/request/new">
        <Layout>
          <NewCardRequest />
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
              <h1 className="text-2xl font-medium mb-2">Page Under Construction</h1>
              <p className="text-[#6B6B6B]">The requested page "{params["rest*"]}" is being built.</p>
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
