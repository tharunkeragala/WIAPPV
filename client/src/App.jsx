import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InvitationPage from './pages/InvitationPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route path="/i/:token" element={<LandingPage />} />
      <Route path="/i/:token/invitation" element={<InvitationPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/" element={<Navigate to="/i/demo-perera-family" replace />} />
      <Route path="*" element={<div className="not-found"><h1>Invitation not found</h1><p>Please check the invitation link you received.</p></div>} />
    </Routes>
  );
}
