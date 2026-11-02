import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginThunk } from '../../store/slices/authSlice';
import { addToast } from '../../store/slices/uiSlice';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error } = useAppSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState('partner@dropflow.in');
  const [password, setPassword] = useState('DropshipPass@2026');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    const result = await dispatch(loginThunk({ identifier, password }));
    if (loginThunk.fulfilled.match(result)) {
      dispatch(addToast({
        type: 'success',
        title: 'Welcome Back!',
        message: 'Successfully authenticated to the Dropshipper Portal.'
      }));
      const from = (location.state as any)?.from?.pathname || '/products';
      navigate(from, { replace: true });
    } else {
      dispatch(addToast({
        type: 'error',
        title: 'Sign In Failed',
        message: (result.payload as string) || 'Invalid credentials'
      }));
    }
  };

  const handleDemoSignIn = async () => {
    setIdentifier('seller@dropflow.in');
    setPassword('DemoSellerPass123!');
    const result = await dispatch(loginThunk({ identifier: 'seller@dropflow.in', password: 'DemoSellerPass123!' }));
    if (loginThunk.fulfilled.match(result)) {
      dispatch(addToast({
        type: 'success',
        title: 'Demo Session Active',
        message: 'Logged into DropFlow Partner Portal in demo mode.'
      }));
      navigate('/products', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Package className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          DropFlow Partner Portal
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500">
          Pan-India Dropship Sourcing & Express Fulfillment
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200/80 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Registered Email or Phone"
              type="text"
              placeholder="e.g. seller@store.com or 9820112345"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Remember Me
              </label>
              <Link to="/activate" className="font-semibold text-brand-600 hover:text-brand-500">
                Activate Account?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full shadow-md"
              size="lg"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">Or</span>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              New to DropFlow?{' '}
              <Link to="/register" className="font-bold text-brand-600 hover:text-brand-500">
                Apply for Seller Partnership →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

