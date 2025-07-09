import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Tracking from './components/Tracking';
import Report from './components/Report';
import './App.css';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'schedule':
        return <Schedule />;
      case 'tracking':
        return <Tracking />;
      case 'report':
        return <Report />;
      case 'routes':
        return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Driver Routes - Coming Soon</h2></div>;
      case 'collections':
        return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Collections Management - Coming Soon</h2></div>;
      case 'users':
        return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">User Management - Coming Soon</h2></div>;
      case 'vehicles':
        return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Vehicle Management - Coming Soon</h2></div>;
      case 'reports':
        return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Reports & Analytics - Coming Soon</h2></div>;
      case 'settings':
        return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">System Settings - Coming Soon</h2></div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;