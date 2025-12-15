import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import FooterChat from './components/layout/FooterChat';
import Dashboard from './components/base/Dashboard/Dashboard';
import PayrollModule from './components/base/payroll/PayrollModule';
import UserManagement from './components/admin/UserManagement/UserManagement';
import EmployeesModule from './components/base/employee/EmployeesModule';
import JobRequisitionModule from './components/recruitment/JobRequisitionModule';
import JobPostingModule from './components/recruitment/JobPostingModule';
import ATSModule from './components/recruitment/ATSModule';
import InterviewsModule from './components/recruitment/InterviewsModule';
import OffersModule from './components/recruitment/OffersModule';
import BackgroundChecksModule from './components/recruitment/BackgroundChecksModule';
import RecruitmentAnalytics from './components/recruitment/RecruitmentAnalytics';
import Login from './components/auth/Login';
import { Role, User } from './shared/types';
import { hasAccess } from './shared/permissions';
import { userService } from './shared/services/userService';
import app from './shared/services/firebaseConfig';
import { Loader2 } from 'lucide-react';

interface GuardProps {
  user: User | null;
  loading: boolean;
  children: React.ReactElement;
}

const RequireAuth: React.FC<GuardProps> = ({ user, loading, children }) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-600">
        <Loader2 className="animate-spin mr-2" /> Checking session...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const RequireRoles: React.FC<{ user: User; module: import('./shared/permissions').Module; action?: 'view' | 'edit' | 'create'; children: React.ReactElement; }> = ({ user, module, action = 'view', children }) => {
  if (!hasAccess(user.role, module, action)) return <Navigate to="/" replace />;
  return children;
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to Firebase Auth state and hydrate profile from Firestore
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        const existing = await userService.getUserById(authUser.uid);
        if (existing) {
          setCurrentUser(existing);
        } else {
          const fallbackName = authUser.email?.split('@')[0] || 'Admin';
          const profile: Omit<User, "id"> = {
            firstName: fallbackName,
            lastName: '',
            email: authUser.email || '',
            role: Role.ADMIN,
            designation: 'Administrator',
            department: 'Administration',
            status: 'active',
            checkInStatus: 'out'
          };
          const created = await userService.addUserWithId(authUser.uid, profile);
          setCurrentUser(created);
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {!isAuthRoute && currentUser && (
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userRole={currentUser.role} />
      )}
      
      {/* Mobile Overlay */}
      {!isAuthRoute && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-[2px] lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className={`flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out ${!isAuthRoute && currentUser ? 'ml-0 lg:ml-24' : 'ml-0'}`}>
        {!isAuthRoute && currentUser && (
          <Topbar user={currentUser} onMenuClick={() => setIsSidebarOpen(true)} />
        )}

        <main className="flex-1 overflow-x-hidden pb-24 lg:pb-8">
          <Routes>
            <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
            <Route 
              path="/" 
              element={
                <RequireAuth user={currentUser} loading={authLoading}>
                  <Dashboard />
                </RequireAuth>
              } 
            />
            <Route 
              path="/users" 
              element={
                <RequireAuth user={currentUser} loading={authLoading}>
                  <RequireRoles user={currentUser as User} module="users">
                    <UserManagement />
                  </RequireRoles>
                </RequireAuth>
              } 
            />
            <Route 
              path="/employees"
              element={
                <RequireAuth user={currentUser} loading={authLoading}>
                  <EmployeesModule />
                </RequireAuth>
              }
            />
            <Route 
              path="/payroll"
              element={
                <RequireAuth user={currentUser} loading={authLoading}>
                  <RequireRoles user={currentUser as User} module="payroll">
                    <PayrollModule />
                  </RequireRoles>
                </RequireAuth>
              }
            />
            <Route
              path="/recruitment"
              element={
                <RequireAuth user={currentUser} loading={authLoading}>
                  <RequireRoles user={currentUser as User} module="requisitions">
                    <JobRequisitionModule currentUser={currentUser as User} />
                  </RequireRoles>
                </RequireAuth>
              }
            />
            <Route
              path="/recruitment/postings"
              element={
                <RequireAuth user={currentUser} loading={authLoading}>
                  <RequireRoles user={currentUser as User} module="postings">
                    <JobPostingModule />
                  </RequireRoles>
                </RequireAuth>
              }
            />
            <Route
              path="/recruitment/ats"
              element={
                <RequireAuth user={currentUser} loading={authLoading}>
                  <RequireRoles user={currentUser as User} module="ats">
                    <ATSModule />
                  </RequireRoles>
                </RequireAuth>
              }
            />
            <Route
              path="/recruitment/interviews"
              element={
                <RequireAuth user={currentUser} loading={authLoading}>
                  <RequireRoles user={currentUser as User} module="interviews">
                    <InterviewsModule />
                  </RequireRoles>
                </RequireAuth>
              }
            />
            <Route
              path="/recruitment/offers"
              element={
                <RequireAuth user={currentUser} loading={authLoading}>
                  <RequireRoles user={currentUser as User} module="offers">
                    <OffersModule />
                  </RequireRoles>
                </RequireAuth>
              }
            />
            <Route
              path="/recruitment/background"
              element={
                <RequireAuth user={currentUser} loading={authLoading}>
                  <RequireRoles user={currentUser as User} module="background">
                    <BackgroundChecksModule />
                  </RequireRoles>
                </RequireAuth>
              }
            />
            <Route
              path="/recruitment/analytics"
              element={
                <RequireAuth user={currentUser} loading={authLoading}>
                  <RequireRoles user={currentUser as User} module="analytics">
                    <RecruitmentAnalytics />
                  </RequireRoles>
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {!isAuthRoute && <FooterChat />}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <Router>
    <AppLayout />
  </Router>
);

export default App;
