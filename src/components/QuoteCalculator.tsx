'use client';

import { useState, useEffect } from 'react';
import iphoneModels from '@/data/iphone-models.json';
import LeadForm from './LeadForm';
import AddressAutocomplete from './AddressAutocomplete';
import ProgressStepper, { useProgressTracking } from './ProgressStepper';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMonitoring } from '@/hooks/useMonitoring';
import { LoadingButton, RetryWrapper, FadeInLoader, ProgressIndicator } from './ui/LoadingStates';

interface IPhoneModel {
  id: string;
  name: string;
  family: string;
  type: string;
  isActivationLockTier: boolean;
  basePrice: any;
}

interface QuoteState {
  selectedModel: IPhoneModel | null;
  selectedStorage: string;
  damages: string[];
  accessories: {
    hasBox: boolean;
    hasCharger: boolean;
  };
  sellMethod: 'pickup' | 'dropoff';
  address: string;
  quote: number | null;
  pickupFee: number | null;
  distance: number | null;
  isActivationLocked: boolean;
}

export default function QuoteCalculator() {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const analytics = useAnalytics();
  const monitoring = useMonitoring();
  const { trackStepCompleted, trackDropOff } = useProgressTracking();
  
  // Loading and error states
  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [quoteState, setQuoteState] = useState<QuoteState>({
    selectedModel: null,
    selectedStorage: '',
    damages: [],
    accessories: {
      hasBox: true,
      hasCharger: true,
    },
    sellMethod: 'pickup',
    address: '',
    quote: null,
    pickupFee: null,
    distance: null,
    isActivationLocked: false,
  });

  const [modelSearch, setModelSearch] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Filter models based on search
  const filteredModels = iphoneModels.filter((model: any) =>
    model.name.toLowerCase().includes(modelSearch.toLowerCase())
  );

  // Calculate quote whenever relevant state changes
  useEffect(() => {
    if (quoteState.selectedModel && quoteState.selectedStorage) {
      calculateQuote();
    } else {
      setQuoteState(prev => ({ ...prev, quote: null, pickupFee: null, distance: null }));
    }
  }, [
    quoteState.selectedModel,
    quoteState.selectedStorage,
    quoteState.damages,
    quoteState.accessories,
    quoteState.isActivationLocked,
    quoteState.address,
    quoteState.sellMethod,
  ]);

  const calculateQuote = async () => {
    if (!quoteState.selectedModel || !quoteState.selectedStorage) {
      return;
    }

    setIsCalculatingQuote(true);
    setQuoteError(null);
    setLoadingProgress(0);

    try {
      // Simulate progressive loading
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 15, 90));
      }, 150);

      const apiCall = fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: quoteState.selectedModel.name,
          storage: quoteState.selectedStorage,
          damages: quoteState.damages,
          hasBox: quoteState.accessories.hasBox,
          hasCharger: quoteState.accessories.hasCharger,
          isActivationLocked: quoteState.isActivationLocked,
          sellMethod: quoteState.sellMethod,
          address: quoteState.address || undefined,
        }),
      });

      // Track API call performance
      const response = await monitoring.trackAPICall(apiCall, '/api/quote');
      clearInterval(progressInterval);
      setLoadingProgress(100);

      if (response.ok) {
        const data = await response.json();
        setQuoteState(prev => ({
          ...prev,
          quote: data.quote,
          pickupFee: data.pickupFee,
          distance: data.distance,
        }));
        
        // Track successful quote generation
        analytics.trackQuoteCompleted(data.quote);
        analytics.trackQuoteVariation({
          model: quoteState.selectedModel.name,
          storage: quoteState.selectedStorage,
          damages: quoteState.damages,
          quote: data.quote,
          basePrice: data.basePrice || 0
        });
      } else {
        const errorData = await response.json();
        console.error('Quote calculation error:', errorData.error);
        
        if (errorData.error?.includes('Pickup not available')) {
          setTimeout(() => {
            alert('Pickup not available for this location. Please consider drop-off at Penrith.');
          }, 500);
        } else {
          throw new Error(errorData.error || 'Failed to calculate quote');
        }
      }
    } catch (error) {
      console.error('Quote calculation error:', error);
      setQuoteError(error instanceof Error ? error : new Error('Failed to calculate quote'));
      
      // Track error
      monitoring.trackError(
        error instanceof Error ? error : new Error('Quote calculation failed'),
        'high',
        {
          model: quoteState.selectedModel.name,
          storage: quoteState.selectedStorage,
          sellMethod: quoteState.sellMethod
        }
      );
    } finally {
      setIsCalculatingQuote(false);
      setTimeout(() => setLoadingProgress(0), 1000);
    }
  };


  const handleModelSelect = (model: any) => {
    setQuoteState(prev => ({ ...prev, selectedModel: model, selectedStorage: '' }));
    setModelSearch(model.name);
    setShowModelDropdown(false);
    analytics.trackModelSelection(model.name);
  };

  const handleDamageToggle = (damage: string) => {
    if (damage === 'Activation/IC-locked') {
      const isCurrentlySelected = quoteState.isActivationLocked;
      setQuoteState(prev => ({ 
        ...prev, 
        isActivationLocked: !prev.isActivationLocked,
        damages: prev.isActivationLocked 
          ? prev.damages.filter(d => d !== damage)
          : [...prev.damages, damage]
      }));
      analytics.trackDamageSelection(damage, !isCurrentlySelected);
      return;
    }

    const isCurrentlySelected = quoteState.damages.includes(damage);
    setQuoteState(prev => ({
      ...prev,
      damages: prev.damages.includes(damage)
        ? prev.damages.filter(d => d !== damage)
        : [...prev.damages, damage]
    }));
    analytics.trackDamageSelection(damage, !isCurrentlySelected);
  };

  // Show lead form when continue is clicked
  if (showLeadForm) {
    return (
      <div className="space-y-6">
        <ProgressStepper 
          currentStep="details" 
          onStepClick={(step) => {
            if (step === 'quote') {
              setShowLeadForm(false);
              trackStepCompleted('details', 'quote');
            }
          }}
        />
        <LeadForm
          quoteData={{
            model: quoteState.selectedModel?.name || '',
            storage: quoteState.selectedStorage,
            damages: quoteState.damages,
            hasBox: quoteState.accessories.hasBox,
            hasCharger: quoteState.accessories.hasCharger,
            isActivationLocked: quoteState.isActivationLocked,
            sellMethod: quoteState.sellMethod,
            address: quoteState.address,
            quote: quoteState.quote || 0,
            pickupFee: quoteState.pickupFee,
            distance: quoteState.distance,
            basePrice: (quoteState.selectedModel as any)?.basePrice[quoteState.selectedStorage] || 0,
            damageDeduction: 0, // Calculate this properly in production
            margin: Math.round(((quoteState.selectedModel as any)?.basePrice[quoteState.selectedStorage] || 0) * 0.30),
          }}
          onBack={() => {
            setShowLeadForm(false);
            trackStepCompleted('details', 'quote');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressStepper currentStep="quote" />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Get Your Instant Quote</h2>
      
      {/* Model Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          iPhone Model
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
          
          {showModelDropdown && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
              {filteredModels.map((model: any) => (
                <button
                  key={model.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  onClick={() => handleModelSelect(model)}
                >
                  {model.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Storage Selection */}
      {quoteState.selectedModel && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Storage
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={quoteState.selectedStorage}
            onChange={(e) => {
              const storage = e.target.value;
              setQuoteState(prev => ({ ...prev, selectedStorage: storage }));
              if (storage && quoteState.selectedModel) {
                analytics.trackStorageSelection(storage, quoteState.selectedModel.name);
              }
            }}
          >
            <option value="">Select storage size</option>
            {Object.keys(quoteState.selectedModel.basePrice).map(storage => (
              <option key={storage} value={storage}>
                {storage}GB
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Damage Checklist */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Damage Assessment
          {quoteState.damages.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              ({quoteState.damages.length} issues selected)
            </span>
          )}
        </label>
        
        <div className="space-y-3">
          {/* Screen & Face ID Group */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-1">Screen & Face ID</h4>
            <div className="space-y-1">
              {['Screen (scratches/cracks)', 'Touch issues', 'Face ID/TrueDepth'].map(damage => (
                <label key={damage} className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={quoteState.damages.includes(damage)}
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
                    checked={quoteState.damages.includes(damage)}
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
                    checked={quoteState.damages.includes(damage)}
                    onChange={() => handleDamageToggle(damage)}
                  />
                  <span className="ml-2 text-sm text-gray-700">{damage}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accessories */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Accessories
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={quoteState.accessories.hasBox}
              onChange={(e) => setQuoteState(prev => ({
                ...prev,
                accessories: { ...prev.accessories, hasBox: e.target.checked }
              }))}
            />
            <span className="ml-2 text-sm text-gray-700">Box</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={quoteState.accessories.hasCharger}
              onChange={(e) => setQuoteState(prev => ({
                ...prev,
                accessories: { ...prev.accessories, hasCharger: e.target.checked }
              }))}
            />
            <span className="ml-2 text-sm text-gray-700">Charger</span>
          </label>
        </div>
        {(!quoteState.accessories.hasBox || !quoteState.accessories.hasCharger) && (
          <p className="text-xs text-gray-500 mt-1">−$20 if box or charger missing</p>
        )}
      </div>

      {/* Sell Method */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sell Method
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="sellMethod"
              value="pickup"
              className="border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={quoteState.sellMethod === 'pickup'}
              onChange={(e) => setQuoteState(prev => ({ ...prev, sellMethod: e.target.value as 'pickup' | 'dropoff' }))}
            />
            <span className="ml-2 text-sm text-gray-700">Pickup</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="sellMethod"
              value="dropoff"
              className="border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={quoteState.sellMethod === 'dropoff'}
              onChange={(e) => setQuoteState(prev => ({ ...prev, sellMethod: e.target.value as 'pickup' | 'dropoff' }))}
            />
            <span className="ml-2 text-sm text-gray-700">Drop-off (Penrith)</span>
          </label>
        </div>
      </div>

      {/* Address (if pickup selected) */}
      {quoteState.sellMethod === 'pickup' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pickup Address
          </label>
          <AddressAutocomplete
            value={quoteState.address}
            onChange={(address) => setQuoteState(prev => ({ ...prev, address }))}
            placeholder="Enter your address or nearby location"
          />
        </div>
      )}

      {/* Quote Display */}
      {quoteState.quote !== null && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              ${quoteState.quote}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Valid until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'short'
              })}, 11:59pm
            </div>
            
            {quoteState.sellMethod === 'pickup' && quoteState.distance && (
              <div className="text-sm text-gray-600">
                {quoteState.distance} km · ~{Math.round(quoteState.distance * 1.5)} min
                {quoteState.pickupFee === 0 ? (
                  <div className="text-green-600 font-medium">Free pickup</div>
                ) : (
                  <div className="text-gray-700">Pickup fee: ${quoteState.pickupFee}</div>
                )}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-2">
              Subject to inspection
            </div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {quoteState.sellMethod === 'pickup' && (
        <p className="text-xs text-gray-500 mb-4">
          Pickup is free if travel cost is under $20; otherwise capped at $30–$50.
        </p>
      )}

      {/* Continue Button */}
      <button
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
        disabled={!quoteState.selectedModel || !quoteState.selectedStorage || quoteState.quote === null}
        onClick={() => {
          setShowLeadForm(true);
          trackStepCompleted('quote', 'details');
          analytics.trackQuoteCompleted(quoteState.quote || 0);
          analytics.trackButtonClick('Continue to Lead Form');
        }}
      >
        Continue
        </button>
      </div>
    </div>
  );
}