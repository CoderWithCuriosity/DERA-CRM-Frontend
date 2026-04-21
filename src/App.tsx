import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Deals from './pages/deals/Deals';
import DealDetail from './pages/deals/DealDetail';
import CreateDeal from './pages/deals/CreateDeal';
import EditDeal from './pages/deals/EditDeal';
import Tickets from './pages/tickets/Tickets';
import TicketDetail from './pages/tickets/TicketDetail';
import CreateTicket from './pages/tickets/CreateTicket';
import EditTicket from './pages/tickets/EditTicket';
import Activities from './pages/activities/Activities';
import Campaigns from './pages/campaigns/Campaigns';
import CampaignDetail from './pages/campaigns/CampaignDetail';
import EmailTemplates from './pages/campaigns/EmailTemplates';
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

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
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
        <Route path="//verify-email-sent" element={<VerifyEmailSent />} />
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
          <Route path="activities" element={<Activities />} />

          {/* Campaigns */}
          <Route path="campaigns">
            <Route index element={<Campaigns />} />
            <Route path=":id" element={<CampaignDetail />} />
            <Route path="templates" element={<EmailTemplates />} />
          </Route>

          {/* Settings - Profile is accessible to all users */}
          <Route path="settings/profile" element={<Profile />} />

          {/* Admin-only Settings Routes */}
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
    </BrowserRouter>
  );
}

export default App;