'use client';

import { useState } from 'react';
import iphoneModels from '@/data/iphone-models.json';
import { useAnalytics } from '@/hooks/useAnalytics';

interface IPhoneModel {
  id: string;
  name: string;
  family: string;
  type: string;
  isActivationLockTier: boolean;
  storageOptions: string[];
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  suburb: string;
}

export default function QuoteCalculator() {
  const analytics = useAnalytics();

  const [selectedModel, setSelectedModel] = useState<IPhoneModel | null>(null);
  const [selectedStorage, setSelectedStorage] = useState('');
  const [damages, setDamages] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    suburb: ''
  });

  const [modelSearch, setModelSearch] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter models based on search
  const filteredModels = iphoneModels.filter((model: any) =>
    model.name.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const handleModelSelect = (model: any) => {
    setSelectedModel(model);
    setModelSearch(model.name);
    setShowModelDropdown(false);
    setSelectedStorage(''); // Reset storage when model changes
    analytics.trackModelSelection(model.name);
  };

  const handleDamageToggle = (damage: string) => {
    const isCurrentlySelected = damages.includes(damage);
    setDamages(prev =>
      prev.includes(damage)
        ? prev.filter(d => d !== damage)
        : [...prev, damage]
    );
    analytics.trackDamageSelection(damage, !isCurrentlySelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.suburb.trim()) newErrors.suburb = 'Suburb is required';
    if (!selectedModel) newErrors.model = 'Please select an iPhone model';
    if (!selectedStorage) newErrors.storage = 'Please select storage size';

    // Basic email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          model: selectedModel?.name,
          storage: selectedStorage,
          damages: damages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setIsSubmitted(true);
      analytics.trackQuoteCompleted(0); // No quote amount for lead capture
    } catch (error) {
      setErrors({ general: 'Unable to submit form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show thank you message after submission
  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Thanks {formData.name}!</h3>
          <p className="text-gray-700 mb-2">We'll call you with a quote within 24 hours.</p>
          <p className="text-sm text-gray-500">Check your email for confirmation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Get Your Quote</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              iPhone Model *
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search iPhone model (e.g., iPhone 13 Pro)"
                value={modelSearch}
                onChange={(e) => {
                  setModelSearch(e.target.value);
                  setShowModelDropdown(true);
                }}
                onFocus={() => setShowModelDropdown(true)}
              />

              {showModelDropdown && modelSearch && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {filteredModels.length > 0 ? (
                    filteredModels.map((model: any) => (
                      <button
                        key={model.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        onClick={() => handleModelSelect(model)}
                      >
                        {model.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No models found</div>
                  )}
                </div>
              )}
            </div>
            {errors.model && <p className="mt-1 text-xs text-red-600">{errors.model}</p>}
          </div>

          {/* Storage Selection */}
          {selectedModel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedStorage}
                onChange={(e) => {
                  const storage = e.target.value;
                  setSelectedStorage(storage);
                  if (storage && selectedModel) {
                    analytics.trackStorageSelection(storage, selectedModel.name);
                  }
                }}
              >
                <option value="">Select storage size</option>
                {selectedModel.storageOptions.map(storage => (
                  <option key={storage} value={storage}>
                    {storage}GB
                  </option>
                ))}
              </select>
              {errors.storage && <p className="mt-1 text-xs text-red-600">{errors.storage}</p>}
            </div>
          )}

          {/* Damage Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Damage Assessment (Optional)
              {damages.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  ({damages.length} issues selected)
                </span>
              )}
            </label>

            <div className="space-y-3 border border-gray-200 rounded-lg p-3">
              {/* Screen & Face ID Group */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Screen & Face ID</h4>
                <div className="space-y-1">
                  {['Screen (scratches/cracks)', 'Touch issues', 'Face ID/TrueDepth'].map(damage => (
                    <label key={damage} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={damages.includes(damage)}
                        onChange={() => handleDamageToggle(damage)}
                      />
                      <span className="ml-2 text-sm text-gray-700">{damage}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Back & Cameras Group */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Back & Cameras</h4>
                <div className="space-y-1">
                  {['Back glass', 'Rear camera', 'Front camera'].map(damage => (
                    <label key={damage} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={damages.includes(damage)}
                        onChange={() => handleDamageToggle(damage)}
                      />
                      <span className="ml-2 text-sm text-gray-700">{damage}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Other Issues Group */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Other Issues</h4>
                <div className="space-y-1">
                  {['Buttons', 'Charging/Port', 'Battery condition', 'Microphones/Speakers', 'Water/Liquid exposure', 'Won\'t power on', 'Motherboard/logic board issue', 'Activation/IC-locked'].map(damage => (
                    <label key={damage} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={damages.includes(damage)}
                        onChange={() => handleDamageToggle(damage)}
                      />
                      <span className="ml-2 text-sm text-gray-700">{damage}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Your Contact Details</h3>

            <div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email address *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <input
                type="text"
                value={formData.suburb}
                onChange={(e) => setFormData(prev => ({ ...prev, suburb: e.target.value }))}
                placeholder="Your suburb *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.suburb && <p className="text-xs text-red-600 mt-1">{errors.suburb}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Get Quote'
            )}
          </button>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
