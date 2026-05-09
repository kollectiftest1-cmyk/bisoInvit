import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EventForm from './pages/EventForm';
import EventDetail from './pages/EventDetail';
import InvitationForm from './pages/InvitationForm';
import PublicInvitation from './pages/PublicInvitation';
import BulkInvitations from './pages/BulkInvitations';
import ControllersPage from './pages/ControllersPage';
import AdminsPage from './pages/AdminsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/i/:code" element={<PublicInvitation />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/events/new" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
            <Route path="/admin/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="/admin/events/:id/edit" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
            <Route path="/admin/events/:id/invitations/new" element={<ProtectedRoute><InvitationForm /></ProtectedRoute>} />
            <Route path="/admin/bulk" element={<ProtectedRoute><BulkInvitations /></ProtectedRoute>} />
            <Route path="/admin/controllers" element={<ProtectedRoute><ControllersPage /></ProtectedRoute>} />
            <Route path="/admin/admins" element={<ProtectedRoute><AdminsPage /></ProtectedRoute>} />
            <Route path="*" element={<div className="container"><h2>Page introuvable</h2></div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
