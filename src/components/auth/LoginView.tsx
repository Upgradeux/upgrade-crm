'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Button } from '../ui/Button';
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconArrowRight,
  IconAlertCircle,
  IconShieldLock,
} from '@tabler/icons-react';

export function LoginView() {
  const { login, addToast } = useCRM();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid credentials. Access denied.');
        setIsLoading(false);
        return;
      }

      // Successful login
      login(data.user);
      addToast('Welcome back! Signed in to upgradeUX Agency CRM.', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[var(--t-background-primary)] text-[var(--t-font-color-primary)] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#5d4ef7]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card - Twenty CRM Design */}
      <div className="w-full max-w-[380px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] rounded-[12px] p-6 shadow-2xl relative z-10 space-y-5 animate-fade-in">
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-[44px] h-[44px] rounded-[10px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] flex items-center justify-center p-2 shadow-sm">
            <img
              src="/logo.png"
              alt="upgradeUX Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-[16px] font-bold tracking-tight text-[var(--t-font-color-primary)]">
              upgradeUX Agency CRM
            </h1>
            <p className="text-[11.5px] text-[var(--t-font-color-tertiary)] mt-0.5">
              Enter your credentials to access your workspace
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-rose-400 text-[11.5px] animate-fade-in">
            <IconAlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
              Admin Email
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-[9px] text-[var(--t-font-color-tertiary)] pointer-events-none">
                <IconMail size={14} />
              </div>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agency.com"
                className="w-full h-[34px] pl-[30px] pr-2 text-[12.5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-medium)] rounded-[6px] outline-none text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)] focus:border-[#5d4ef7] transition-all font-mono"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
                Password
              </label>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-[9px] text-[var(--t-font-color-tertiary)] pointer-events-none">
                <IconLock size={14} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-[34px] pl-[30px] pr-[32px] text-[12.5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-medium)] rounded-[6px] outline-none text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)] focus:border-[#5d4ef7] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-[8px] text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] p-0.5 cursor-pointer transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IconEyeOff size={14} /> : <IconEye size={14} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[36px] mt-2 rounded-[6px] bg-[#5d4ef7] hover:bg-[#4d3ef0] active:scale-[0.99] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 shadow-md shadow-[#5d4ef7]/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to CRM</span>
                <IconArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="pt-2 border-t border-[var(--t-border-color-light)] flex items-center justify-center gap-1.5 text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
          <IconShieldLock size={12} className="text-emerald-500" />
          <span>Agency Access Gateway</span>
        </div>
      </div>
    </div>
  );
}
