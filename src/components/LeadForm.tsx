'use client';

import { useState } from 'react';
import AddressAutocomplete from './AddressAutocomplete';
import ProgressStepper, { useProgressTracking } from './ProgressStepper';
import { useAnalytics } from '@/hooks/useAnalytics';

interface QuoteData {
  model: string;
  storage: string;
  damages: string[];
  hasBox: boolean;
  hasCharger: boolean;
  isActivationLocked: boolean;
  sellMethod: 'pickup' | 'dropoff';
  address: string;
  quote: number;
  pickupFee: number | null;
  distance: number | null;
  basePrice: number;
  damageDeduction: number;
  margin: number;
}

interface LeadFormProps {
  quoteData: QuoteData;
  onBack: () => void;
}

interface LeadData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address: string;
  notes: string;
}

export default function LeadForm({ quoteData, onBack }: LeadFormProps) {
  const analytics = useAnalytics();
  const { trackStepCompleted, trackDropOff } = useProgressTracking();
  const [leadData, setLeadData] = useState<LeadData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: quoteData.address,
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<LeadData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateAUPhone = (phone: string) => {
    // Basic AU phone validation (mobile numbers)
    const phoneRegex = /^(\+61|0)[4-5][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Partial<LeadData> = {};
    
    if (!leadData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!leadData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!leadData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone is required';
    } else if (!validateAUPhone(leadData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid Australian mobile number';
    }
    
    if (!leadData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(leadData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (quoteData.sellMethod === 'pickup' && !leadData.address.trim()) {
      newErrors.address = 'Pickup location is required';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Validate model data before submission
    if (!quoteData.model || quoteData.model.trim() === '') {
      alert('Invalid iPhone model selected. Please go back and select a model.');
      return;
    }

    if (!quoteData.storage || quoteData.storage.trim() === '') {
      alert('Invalid storage option. Please go back and select storage.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create lead via API
      const leadResponse = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: leadData.email,
          firstName: leadData.firstName,
          lastName: leadData.lastName,
          phoneNumber: leadData.phoneNumber,
          address: leadData.address,
          sellMethod: quoteData.sellMethod,
          distance: quoteData.distance,
          pickupFee: quoteData.pickupFee,
          quote: {
            device: {
              model: quoteData.model,
              storage: quoteData.storage,
            },
            damages: quoteData.damages,
            hasBox: quoteData.hasBox,
            hasCharger: quoteData.hasCharger,
            isActivationLocked: quoteData.isActivationLocked,
            basePrice: quoteData.basePrice,
            damageDeduction: quoteData.damageDeduction,
            margin: quoteData.margin,
            finalQuote: quoteData.quote,
            pickupFee: quoteData.pickupFee,
            notes: leadData.notes,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
      });

      if (!leadResponse.ok) {
        const errorData = await leadResponse.json();
        throw new Error(errorData.error || 'Failed to create lead');
      }

      const leadResult = await leadResponse.json();

      // Track lead creation
      analytics.trackLeadCreated(leadResult.leadId, quoteData.sellMethod);

      // Send verification email
      const verifyResponse = await fetch('/api/verify/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: leadResult.leadId,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Failed to send verification email');
      }

      // Track verification email sent
      analytics.trackVerificationSent(leadResult.leadId, leadData.email);
      trackStepCompleted('details', 'verification');

      setIsSubmitted(true);
    } catch (error) {
      console.error('❌ Error submitting lead:', error);
      trackDropOff('details', 'form_submission_error');
      alert('Failed to send quote. Please try again or contact us on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <ProgressStepper currentStep="verification" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
          <div className="text-center">
          <div className="text-green-600 text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quote Submitted!</h2>
          
          {/* Quote Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              ${quoteData.quote}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              {quoteData.model} • {quoteData.storage}GB
            </div>
            {quoteData.damages.length > 0 && (
              <div className="text-sm text-gray-600 mb-1">
                {quoteData.damages.length} damage{quoteData.damages.length > 1 ? 's' : ''} selected
              </div>
            )}
            {quoteData.sellMethod === 'pickup' && quoteData.pickupFee !== null && (
              <div className="text-sm text-gray-600">
                {quoteData.pickupFee === 0 ? 'Free pickup' : `Pickup fee: $${quoteData.pickupFee}`}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Subject to inspection • Valid for 7 days
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            We've sent your quote to <strong>{leadData.email}</strong>. 
            Please check your email and click the confirmation link to continue.
          </p>
          
          <div className="text-sm text-gray-500 mb-4">
            Didn't receive the email? Check your spam folder or contact us on WhatsApp.
          </div>
          
          <a
            href="https://wa.me/61415957027"
            className="inline-flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 text-sm"
          >
            📱 WhatsApp +61 415 957 027
          </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 mr-4"
        >
          ← Back
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Your Details</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={leadData.firstName}
            onChange={(e) => setLeadData(prev => ({ ...prev, firstName: e.target.value }))}
            placeholder="Enter your first name"
          />
          {errors.firstName && (
            <p className="text-red-600 text-xs mt-1 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.firstName}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={leadData.lastName}
            onChange={(e) => setLeadData(prev => ({ ...prev, lastName: e.target.value }))}
            placeholder="Enter your last name"
          />
          {errors.lastName && (
            <p className="text-red-600 text-xs mt-1 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.lastName}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={leadData.phoneNumber}
            onChange={(e) => setLeadData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="0412 345 678"
          />
          {errors.phoneNumber && (
            <p className="text-red-600 text-xs mt-1 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.phoneNumber}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={leadData.email}
            onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.email}
            </p>
          )}
        </div>

        {/* Location (if pickup) */}
        {quoteData.sellMethod === 'pickup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Location *
            </label>
            <AddressAutocomplete
              value={leadData.address}
              onChange={(address) => setLeadData(prev => ({ ...prev, address }))}
              placeholder="Enter your pickup address"
              required
            />
            {errors.address && (
              <p className="text-red-600 text-xs mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.address}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
            value={leadData.notes}
            onChange={(e) => setLeadData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional information about your device..."
          />
        </div>


        {/* Consent */}
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
          By continuing you agree to our Terms & Privacy. Subject to inspection.
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin mr-2">⏳</span>
              Sending quote...
            </span>
          ) : (
            'Email my quote to verify'
          )}
        </button>
      </form>
    </div>
  );
}