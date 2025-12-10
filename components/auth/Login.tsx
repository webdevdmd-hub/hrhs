import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../shared/services/authService';
import { userService } from '../../shared/services/userService';
import { Role, User } from '../../shared/types';
import Button from '../shared/ui/Button';
import { LogIn, AlertCircle } from 'lucide-react';

interface LocationState {
  from?: { pathname: string };
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: 'webdevdmd@gmail.com',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState)?.from?.pathname || '/';

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const ensureProfile = async (uid: string, email: string) => {
    const existing = await userService.getUserById(uid);
    if (existing) return existing;

    const firstName = email.split('@')[0] || 'Admin';
    const department = 'Administration';

    const profile: Omit<User, "id"> = {
      firstName,
      lastName: '',
      email,
      role: Role.ADMIN,
      designation: 'Administrator',
      department,
      status: 'active',
      checkInStatus: 'out'
    };

    const created = await userService.addUserWithId(uid, profile);
    return created;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const trimmedEmail = formData.email.trim();
      const { user } = await authService.signIn(trimmedEmail, formData.password);
      const email = user.email || trimmedEmail;
      await ensureProfile(user.uid, email);
      navigate(from === '/login' ? '/' : from, { replace: true });
    } catch (err: any) {
      console.error('Login failed', err);
      let msg = 'Login failed. Please check your credentials.';
      if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = 'Email or password is incorrect.';
      else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Please wait and try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white/95 shadow-2xl shadow-slate-900/40 p-6 sm:p-8 border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
            <LogIn size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
            <p className="text-sm text-slate-600">Sign in to continue to HR Nexus.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 inline-flex w-full items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              placeholder="webdevdmd@gmail.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="sm:col-span-2 text-xs text-slate-500">Profile defaults are saved to Firestore automatically on first sign-in.</p>
          </div>

          <Button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
