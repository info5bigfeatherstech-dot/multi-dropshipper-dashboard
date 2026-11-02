import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Mail, KeyRound, Lock, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { dropshipperAuthService } from '../../services/dropshipperAuthService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';

export const ActivatePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState<'request_otp' | 'verify_otp'>('request_otp');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const isEmail = identifier.includes('@');
      const res = await dropshipperAuthService.sendActivationOtp(
        isEmail ? { email: identifier.trim() } : { phone: identifier.trim() }
      );
      dispatch(addToast({
        type: 'info',
        title: 'OTP Dispatched',
        message: res.message || 'Activation OTP sent to your registered contact.'
      }));
      setStep('verify_otp');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch OTP. Ensure your application has been approved.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !password) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isEmail = identifier.includes('@');
      const res = await dropshipperAuthService.completeActivation({
        ...(isEmail ? { email: identifier.trim() } : { phone: identifier.trim() }),
        otp: otp.trim(),
        password
      });

      dispatch(addToast({
        type: 'success',
        title: 'Account Activated!',
        message: res.message || 'Your dropshipper login credentials have been set. Please sign in.'
      }));

      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Activation failed. Please check the OTP entered.');
    } finally {
      setLoading(false);
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
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Activate Dropshipper Account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Set your terminal password after admin verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200/80 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {step === 'request_otp' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the email address or mobile number registered with your approved partner application. We will send a one-time verification code.
              </p>

              <Input
                label="Registered Email or Phone"
                placeholder="e.g. rahul@business.com or 9820112345"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full shadow-md"
                size="lg"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Activation Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCompleteActivation} className="space-y-4">
              <div className="p-3 rounded-xl bg-brand-50 border border-brand-100 text-brand-900 text-xs flex items-center justify-between">
                <span>Code sent to: <strong>{identifier}</strong></span>
                <button
                  type="button"
                  onClick={() => setStep('request_otp')}
                  className="text-brand-600 font-bold hover:underline"
                >
                  Change
                </button>
              </div>

              <Input
                label="6-Digit OTP"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                leftIcon={<KeyRound className="w-4 h-4" />}
              />

              <Input
                label="Create Portal Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full shadow-md"
                size="lg"
                isLoading={loading}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Complete Activation & Login
              </Button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already activated?{' '}
              <Link to="/login" className="font-bold text-brand-600 hover:text-brand-500">
                Sign in to Dashboard →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

