import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReportDetailPage from './pages/ReportDetailPage'; // Will create this later
import { AuthProvider, useAuth } from './services/AuthContext'; // Will create AuthContext later
import SidebarLayout from './components/SidebarLayout'; // Will create this later

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<SidebarLayout />}> {/* Wrap protected routes with SidebarLayout */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/report/:id" element={<ReportDetailPage />} />
            {/* Add other protected routes here */}
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={useAuth().user ? "/dashboard" : "/login"} />} />
      </Routes>
    </AuthProvider>
  );
}

// ProtectedRoute component to handle authentication checks
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Optional: Show a loading spinner while checking auth status
    return <div className="flex justify-center items-center h-screen"><div>Loading...</div></div>;
  }

  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // Render child routes if authenticated
};


export default App;
