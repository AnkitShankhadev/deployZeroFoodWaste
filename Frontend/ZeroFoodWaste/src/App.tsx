import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { SocketProvider } from "./hooks/useSocket";
import { LandingPage } from "./pages/LandingPage";
import Auth from "./pages/Auth";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DonationsPage from "./pages/DonationsPage";
import { CreateDonationPage } from "./pages/CreateDonationPage";
import { EditDonationPage } from "./pages/EditDonationPage";
import { DonationDetailPage } from "./pages/DonationDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import MapPage from "./pages/MapPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import DonorDashboard from "./pages/dashboard/DonorDashboard";
import NGODashboard from "./pages/dashboard/NGODashboard";
import VolunteerDashboard from "./pages/dashboard/VolunteerDashboard";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";



function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/donations" element={<DonationsPage />} />
          <Route path="/donations/:id" element={<DonationDetailPage />} />
          <Route
            path="/create-donation"
            element={
              <ProtectedRoute>
                <CreateDonationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donations/:id/edit"
            element={
              <ProtectedRoute>
                <EditDonationPage />
              </ProtectedRoute>
            }
          />
          <Route path="/map" element={<MapPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/donor"
            element={
              <ProtectedRoute>
                <DonorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ngo"
            element={
              <ProtectedRoute>
                <NGODashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/volunteer"
            element={
              <ProtectedRoute>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
