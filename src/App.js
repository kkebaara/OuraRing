import React, { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Main } from './components/layout/Main';
import { LoadingState } from './components/dashboard/LoadingState';
import { LoginPage } from './pages/LoginPage';
import './App.css';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      <Header />
      <Main>
        {!isAuthenticated ? (
          <LoginPage />
        ) : (
          <Suspense fallback={<LoadingState />}>
            <DashboardPage />
          </Suspense>
        )}
      </Main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
