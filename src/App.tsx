import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeWrapper } from './components/ThemeWrapper';
import { Layout } from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import RequestVerification from './pages/auth/RequestVerification';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Contacts } from './pages/contacts/Contacts';
import ContactDetail from './pages/contacts/ContactDetail';
import { EditContact } from './pages/contacts/EditContact';
import { Messages } from './pages/messages/Messages';
import { NotificationsPage } from './pages/notifications/Notifications';
import { Documents } from './pages/documents/Documents';
import Deals from './pages/deals/Deals';
import DealDetail from './pages/deals/DealDetail';
import CreateDeal from './pages/deals/CreateDeal';
import EditDeal from './pages/deals/EditDeal';
import Tickets from './pages/tickets/Tickets';
import TicketDetail from './pages/tickets/TicketDetail';
import CreateTicket from './pages/tickets/CreateTicket';
import EditTicket from './pages/tickets/EditTicket';
import Activities from './pages/activities/Activities';
import ActivityDetail from './pages/activities/ActivityDetail';
import CreateActivity from './pages/activities/CreateActivity';
import { Reports } from './pages/reports/Reports';
import Campaigns from './pages/campaigns/Campaigns';
import CampaignDetail from './pages/campaigns/CampaignDetail';
import CreateCampaign from './pages/campaigns/CreateCampaign';
import EmailTemplates from './pages/campaigns/EmailTemplates';
import EditTemplate from './pages/campaigns/EditTemplate';
import Profile from './pages/settings/Profile';
import Organization from './pages/settings/Organization';
import Users from './pages/settings/Users';
import AuditLogs from './pages/admin/AuditLogs';
import SystemHealth from './pages/admin/SystemHealth';
import Backups from './pages/admin/Backups';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import { useAuth } from './hooks/useAuth';
import { CreateContact } from './pages/contacts/CreateContact';
import VerifyEmailSent from './pages/auth/VerifyEmailSent';
import { TemplateForm } from './pages/campaigns/TemplateForm';
import TemplateDetail from './pages/campaigns/TemplateDetail';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Create a separate component for the routes that uses useNavigate
function AppRoutes() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Add this useEffect for session expiry handling
  useEffect(() => {
    const handleSessionExpired = () => {
      // Clear auth state
      logout();
      // Navigate to login
      navigate('/login', { replace: true });
      toast.error('Session expired. Please login again.');
    };

    // Listen for custom event
    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [logout, navigate]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" /> : <Login />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/" /> : <Register />
      } />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/request-verification" element={<RequestVerification />} />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />

        {/* Contacts */}
        <Route path="contacts">
          <Route index element={<Contacts />} />
          <Route path=":id" element={<ContactDetail />} />
          <Route path="new" element={<CreateContact />} />
          <Route path=":id/edit" element={<EditContact />} />
        </Route>

        {/* Messages */}
        <Route path="messages" element={<Messages />} />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />
        
        {/* Documents */}
        <Route path="documents" element={<Documents />} />

        {/* Reports */}
        <Route path="reports" element={<Reports />} />

        {/* Deals */}
        <Route path="deals">
          <Route index element={<Deals />} />
          <Route path=":id" element={<DealDetail />} />
          <Route path="new" element={<CreateDeal />} />
          <Route path=":id/edit" element={<EditDeal />} />
        </Route>

        {/* Tickets */}
        <Route path="tickets">
          <Route index element={<Tickets />} />
          <Route path=":id" element={<TicketDetail />} />
          <Route path="new" element={<CreateTicket />} />
          <Route path=":id/edit" element={<EditTicket />} />
        </Route>

        {/* Activities */}
        <Route path="activities">
          <Route index element={<Activities />} />
          <Route path="new" element={<CreateActivity />} />
          <Route path=":id" element={<ActivityDetail />} />
          <Route path=":id/edit" element={<CreateActivity />} />
        </Route>

        {/* Campaigns */}
        <Route path="campaigns">
          <Route index element={<Campaigns />} />
          <Route path="new" element={<CreateCampaign />} />
          <Route path="templates" element={<EmailTemplates />} />
          <Route path="templates/new" element={<TemplateForm />} />
          <Route path="templates/:templateId" element={<TemplateDetail />} />
          <Route path="templates/:templateId/edit" element={<EditTemplate />} />
          <Route path=":id" element={<CampaignDetail />} />
        </Route>

        {/* Settings */}
        <Route path="settings/profile" element={<Profile />} />

        <Route path="settings/organization" element={
          <AdminRoute>
            <Organization />
          </AdminRoute>
        } />

        <Route path="settings/users" element={
          <AdminRoute>
            <Users />
          </AdminRoute>
        } />

        {/* Admin Routes */}
        <Route path="admin/audit-logs" element={
          <AdminRoute>
            <AuditLogs />
          </AdminRoute>
        } />

        <Route path="admin/system-health" element={
          <AdminRoute>
            <SystemHealth />
          </AdminRoute>
        } />

        <Route path="admin/backups" element={
          <AdminRoute>
            <Backups />
          </AdminRoute>
        } />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// Main App component - BrowserRouter is wrapped here
function App() {
  return (
    <ThemeWrapper>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeWrapper>
  );
}

export default App;