import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

// Icons (simple placeholders, replace with actual icons e.g., from heroicons or react-icons)
const DashboardIcon = () => <span>D</span>;
const UsersIcon = () => <span>U</span>; // Example for a future page
const SettingsIcon = () => <span>S</span>; // Example for a future page
const LogoutIcon = () => <span>L</span>;


const SidebarLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile toggle

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Logout failed:', error);
      // Optionally show an error message to the user
    }
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
     ${isActive ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'}`;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-indigo-600 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col`}>
        <div className="flex items-center justify-center h-16 bg-indigo-700">
          <span className="text-xl font-bold">Admin Panel</span>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <NavLink to="/dashboard" className={navLinkClasses}>
            <DashboardIcon />
            <span className="ml-3">Dashboard</span>
          </NavLink>
          {/* Add more navigation links here as needed */}
          {/* <NavLink to="/users" className={navLinkClasses}>
            <UsersIcon />
            <span className="ml-3">Users</span>
          </NavLink>
          <NavLink to="/settings" className={navLinkClasses}>
            <SettingsIcon />
            <span className="ml-3">Settings</span>
          </NavLink> */}
        </nav>
        <div className="p-4 border-t border-indigo-500">
            {user && <p className="text-sm text-indigo-200 mb-2">Logged in as: {user.email}</p>}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-indigo-100 rounded-md hover:bg-indigo-700 hover:text-white transition-colors duration-150 ease-in-out"
          >
            <LogoutIcon />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header for sidebar toggle */}
        <header className="md:hidden bg-white shadow-md">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xl font-bold text-indigo-600">Admin Panel</span>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 focus:outline-none focus:text-gray-700">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <Outlet /> {/* Child routes will render here */}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
