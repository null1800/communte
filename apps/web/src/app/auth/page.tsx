'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Phone, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type Step = 'PHONE' | 'OTP';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Discover a product',
    body: 'Browse our wholesale catalog and find something your household needs.',
  },
  {
    step: '02',
    title: 'Join a buying group',
    body: 'Add your quantity to a group order. No payment yet.',
  },
  {
    step: '03',
    title: 'Group reaches target',
    body: 'Once funded, the bulk order is placed with the supplier.',
  },
  {
    step: '04',
    title: 'Collect & save',
    body: 'Pick up at your local collection point and see your savings grow.',
  },
];

export default function AuthPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [step, setStep]   = useState<Step>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp]     = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  const otpRefs = Array.from({ length: 6 }, () =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useRef<HTMLInputElement>(null),
  );

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 9) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
    }, 800);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;
    setLoading(true);
    setTimeout(() => {
      signIn(phone || '+260 977 842 109', 'consumer');
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect') || '/home';
      router.push(redirect);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — auth form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 max-w-md mx-auto lg:mx-0 lg:max-w-sm xl:max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-black text-base">CU</span>
          </div>
          <div>
            <p className="font-black text-base tracking-tight leading-none">ComUnite</p>
            <p className="text-2xs text-muted">Group Purchasing Platform</p>
          </div>
        </Link>

        {step === 'PHONE' && (
          <form onSubmit={handleSendOtp} className="w-full space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-black tracking-tight">Welcome</h1>
              <p className="text-sm text-muted">
                Enter your phone number to continue
              </p>
            </div>

            {/* Phone input */}
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 block">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="h-11 flex items-center px-3 bg-white border border-border rounded-xl text-sm font-semibold text-foreground shrink-0">
                  +260
                </div>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="97X XXX XXX"
                    className="w-full h-11 pl-10 pr-4 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Continue
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>

            <p className="text-xs text-muted text-center">
              By continuing you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerify} className="w-full space-y-5">
            <button
              type="button"
              onClick={() => setStep('PHONE')}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-2"
            >
              <X className="w-4 h-4" /> Change number
            </button>

            <div className="space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Check your phone</h1>
              <p className="text-sm text-muted">
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-foreground">+260 {phone}</span>
              </p>
            </div>

            {/* OTP inputs */}
            <div className="flex gap-2.5 justify-between">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="
                    w-11 h-14 text-center text-xl font-bold
                    bg-white border border-border rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    transition-all
                  "
                />
              ))}
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Verify Code
            </Button>

            <p className="text-xs text-center text-muted">
              Didn't receive it?{' '}
              <button type="button" className="text-primary font-medium hover:underline">
                Resend code
              </button>
            </p>

            {/* Demo hint */}
            <p className="text-xs text-center text-muted bg-accent-50 border border-accent-100 rounded-lg px-3 py-2">
              Demo: enter any 6 digits to continue
            </p>
          </form>
        )}
      </div>

      {/* Right panel — How It Works (desktop only) */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center px-12">
        <div className="max-w-sm text-white space-y-10">
          <div className="space-y-2">
            <p className="text-primary-200 text-sm font-semibold uppercase tracking-widest">
              How ComUnite works
            </p>
            <h2 className="text-3xl font-black leading-snug">
              Wholesale prices for every household
            </h2>
            <p className="text-primary-200 text-sm leading-relaxed">
              ComUnite aggregates community demand so that everyday shoppers can access the same bulk prices that retailers pay.
            </p>
          </div>

          <div className="space-y-6">
            {HOW_IT_WORKS.map(item => (
              <div key={item.step} className="flex gap-4">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-sm font-black text-primary-200">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-primary-200 text-xs mt-0.5 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
