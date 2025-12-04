'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import InteractiveCalendar from '@/components/calendar/InteractiveCalendar';
import ProgressStepper, { useProgressTracking } from '@/components/ProgressStepper';
import { useAnalytics } from '@/hooks/useAnalytics';

interface VerificationData {
  valid: boolean;
  lead?: {
    email: string;
    firstName?: string;
    sellMethod: string;
    address?: string;
  };
  quote?: {
    device: string;
    finalQuote: number;
    expiresAt: string;
    pickupFee?: number;
  };
}

interface ConfirmedData {
  leadId: string;
  quote: {
    id: string;
    device: string;
    finalQuote: number;
    damages: string[];
    hasBox: boolean;
    hasCharger: boolean;
    isActivationLocked: boolean;
    expiresAt: string;
    pickupFee?: number;
  };
  lead: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
    sellMethod: string;
    distance?: number;
    pickupFee?: number;
  };
}

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const analytics = useAnalytics();
  const { trackStepCompleted, trackDropOff } = useProgressTracking();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [confirmedData, setConfirmedData] = useState<ConfirmedData | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link');
      setLoading(false);
      return;
    }

    // Validate token
    fetch(`/api/verify/confirm?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setVerificationData(data);
        }
      })
      .catch(err => {
        console.error('Verification check error:', err);
        setError('Unable to verify token. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleConfirmVerification = async () => {
    if (!token) return;

    setIsConfirming(true);
    try {
      const response = await fetch('/api/verify/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setConfirmedData(data);
        setVerificationData(null);
        
        // Track verification completion
        if (data.leadId) {
          analytics.trackVerificationCompleted(data.leadId);
          trackStepCompleted('verification', 'scheduling');
        }
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      trackDropOff('verification', 'confirmation_error');
      setError('Unable to confirm verification. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSchedulingComplete = () => {
    // Track scheduling completion
    trackStepCompleted('scheduling', 'confirmed');
    console.log('Scheduling completed successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md mx-auto text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <a
              href="/"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
            >
              Get a new quote
            </a>
            <a
              href="https://wa.me/61415957027"
              className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700"
            >
              📱 WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (confirmedData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="font-bold text-xl text-gray-900">
                SellPhones.sydney
              </div>
              <a href="tel:+61415957027" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                📱 +61 415 957 027
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="text-green-600 text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-600">
              Now let's schedule your {confirmedData.lead.sellMethod === 'pickup' ? 'pickup' : 'drop-off appointment'}
            </p>
          </div>

          <ProgressStepper currentStep="scheduling" leadId={confirmedData.lead.id} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quote Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h3 className="font-semibold text-gray-900 mb-4">Your Quote</h3>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      ${confirmedData.quote.finalQuote}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {confirmedData.quote.device}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Valid until {new Date(confirmedData.quote.expiresAt).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}, 11:59pm
                    </div>
                    
                    {confirmedData.lead.sellMethod === 'pickup' && confirmedData.quote.pickupFee !== undefined && (
                      <div className="text-sm text-gray-600">
                        {confirmedData.quote.pickupFee === 0 ? (
                          <div className="text-green-600 font-medium">Free pickup</div>
                        ) : (
                          <div className="text-gray-700">Pickup fee: ${confirmedData.quote.pickupFee}</div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      Subject to inspection
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="capitalize">{confirmedData.lead.sellMethod}</span>
                  </div>
                  {confirmedData.lead.address && (
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="text-right max-w-32 truncate">{confirmedData.lead.address}</span>
                    </div>
                  )}
                  {confirmedData.quote.damages.length > 0 && (
                    <div className="flex justify-between">
                      <span>Damages:</span>
                      <span>{confirmedData.quote.damages.length} selected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="lg:col-span-2">
              <InteractiveCalendar
                leadData={{
                  id: confirmedData.lead.id,
                  email: confirmedData.lead.email,
                  firstName: confirmedData.lead.firstName || '',
                  lastName: confirmedData.lead.lastName || '',
                  phoneNumber: confirmedData.lead.phoneNumber || '',
                  sellMethod: confirmedData.lead.sellMethod as 'pickup' | 'dropoff',
                  address: confirmedData.lead.address || '',
                  distance: confirmedData.lead.distance,
                }}
                quoteData={{
                  id: confirmedData.quote.id,
                  device: confirmedData.quote.device,
                  finalQuote: confirmedData.quote.finalQuote,
                  expiresAt: confirmedData.quote.expiresAt,
                }}
                onComplete={handleSchedulingComplete}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (verificationData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProgressStepper currentStep="verification" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md mx-auto text-center mt-6">
          <div className="text-blue-600 text-4xl mb-4">📧</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Verify Your Email</h1>
          
          {verificationData.quote && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                ${verificationData.quote.finalQuote}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                {verificationData.quote.device}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Valid until {new Date(verificationData.quote.expiresAt).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}, 11:59pm
              </div>
              
              {verificationData.lead?.sellMethod === 'pickup' && verificationData.quote.pickupFee !== undefined && (
                <div className="text-sm text-gray-600">
                  {verificationData.quote.pickupFee === 0 ? (
                    <div className="text-green-600 font-medium">Free pickup</div>
                  ) : (
                    <div className="text-gray-700">Pickup fee: ${verificationData.quote.pickupFee}</div>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-gray-600 mb-6">
            Hi{verificationData.lead?.firstName ? ` ${verificationData.lead.firstName}` : ''},<br />
            Click the button below to confirm your email and schedule your {verificationData.lead?.sellMethod === 'pickup' ? 'pickup' : 'drop-off'}.
          </p>
          
          <button
            onClick={handleConfirmVerification}
            disabled={isConfirming}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                Confirming...
              </span>
            ) : (
              'Confirm Email & Schedule'
            )}
          </button>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Need help? <a href="https://wa.me/61415957027" className="text-blue-600 hover:underline">WhatsApp us</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}