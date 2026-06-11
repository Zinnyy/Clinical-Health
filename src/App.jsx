import React, { useState, useEffect } from 'react';

import AuthScreen from './components/AuthScreen';
import  PatientRegistry from './components/PatientRegistry';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('Operator');
  const [currentView, setCurrentView] = useState('registry'); // tracks 'registry' or 'admin'

  // Checks browser storage to see if a valid session exists
  const checkAuthentication = () => {
    const token = localStorage.getItem('jwtToken');
    const role = localStorage.getItem('userRole') || 'Operator';
    
    if (token) {
      setUserRole(role);
      setIsAuthenticated(true);

      if (role === 'Admin') {
        setCurrentView('admin'); // Instantly force mounts the AdminPanel layout!
      } else {
        setCurrentView('registry'); // Standard operators stay on Patient Registry
      }
    } else {
      setIsAuthenticated(false);
    }
  };

  // Run the authentication status check when the application initializes
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Wipes browser session parameters clean to log the staff worker out safely
  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole('Operator');
    setCurrentView('registry');
  };

  // Enforces the lock screen guard if the user has not authenticated yet
  if (!isAuthenticated) {
    return <AuthScreen onLoginSuccess={checkAuthentication} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Global Secure Context Header Bar */}
      <div className="w-full bg-gray-900 text-gray-400 px-6 py-2.5 text-xs font-semibold font-mono flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
          <span>SECURE TERMINAL TUNNEL ACTIVE • ROLE: {userRole}</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="hover:text-white transition-colors flex items-center space-x-1"
          type="button"
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Disconnect Session</span>
        </button>
      </div>

      {/* Primary Workspace View Switch Matrix Router */}
      {currentView === 'admin' && userRole === 'Admin' ? (
        <AdminPanel onBack={() => setCurrentView('registry')} />
      ) : (
        <PatientRegistry 
          userRole={userRole} 
          onSwitchToAdmin={() => setCurrentView('admin')} 
        />
      )}

    </div>
  );
}

