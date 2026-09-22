'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  phone: string;
  groupTitle: string;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  phone,
  groupTitle,
  onSuccess,
}) => {
  const [state, setState] = useState<'AWAITING_PROMPT' | 'SUCCESS' | 'FAILED'>('AWAITING_PROMPT');
  const [timeLeft, setTimeLeft] = useState(120); // 2-minute USSD countdown

  useEffect(() => {
    if (!isOpen || state !== 'AWAITING_PROMPT') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setState('FAILED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, state]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSimulateSuccess = () => {
    setState('SUCCESS');
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-xl text-center space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {state === 'AWAITING_PROMPT' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 animate-pulse">
              <Smartphone className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">Check Your Phone</h3>
              <p className="text-sm text-gray-600">
                A prompt for <span className="font-semibold text-emerald-700">ZMW {amount.toFixed(2)}</span> has been sent to <span className="font-mono text-gray-800">{phone}</span> for {groupTitle}.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="text-xs font-semibold text-amber-800">Time Remaining to enter PIN:</div>
              <div className="text-2xl font-bold text-amber-900 font-mono mt-0.5">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={handleSimulateSuccess}
                className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition"
              >
                Approve Payment (Demo)
              </button>
              <p className="text-xs text-gray-400">Please enter your MTN Mobile Money PIN on your phone</p>
            </div>
          </div>
        )}

        {state === 'SUCCESS' && (
          <div className="space-y-3 py-4">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-2xl font-bold text-gray-900">Payment Confirmed!</h3>
            <p className="text-sm text-gray-600">
              Your contribution of ZMW {amount.toFixed(2)} was received. Group funding progress updated.
            </p>
          </div>
        )}

        {state === 'FAILED' && (
          <div className="space-y-4">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
            <h3 className="text-xl font-bold text-gray-900">Payment Timed Out</h3>
            <p className="text-sm text-gray-600">
              The USSD payment prompt expired or was dismissed. You have not been charged.
            </p>
            <button
              onClick={() => {
                setState('AWAITING_PROMPT');
                setTimeLeft(120);
              }}
              className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition"
            >
              Retry Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
