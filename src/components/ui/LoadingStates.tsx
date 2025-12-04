'use client';

import { useState, useEffect } from 'react';

// Generic loading spinner
export function LoadingSpinner({ size = 'md', color = 'blue' }: { 
  size?: 'sm' | 'md' | 'lg'; 
  color?: 'blue' | 'white' | 'gray' 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };
  
  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}>
      <svg fill="none" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

// Quote calculator skeleton
export function QuoteCalculatorSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="space-y-6">
        {/* Model selection skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        
        {/* Storage selection skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Damage selection skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Quote result skeleton */}
        <div className="border-t pt-4">
          <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

// Lead form skeleton
export function LeadFormSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        
        {/* Form fields skeleton */}
        {[1,2,3,4].map(i => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
        
        {/* Submit button skeleton */}
        <div className="h-12 bg-gray-200 rounded w-full mt-6"></div>
      </div>
    </div>
  );
}

// Progressive loading with timeout
export function ProgressiveLoader({ 
  children, 
  fallback, 
  timeout = 5000,
  onTimeout 
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  timeout?: number;
  onTimeout?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setHasTimedOut(true);
        onTimeout?.();
      }
    }, timeout);

    // Simulate loading completion
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(loadTimer);
    };
  }, [isLoading, timeout, onTimeout]);

  if (hasTimedOut) {
    return (
      <div className="text-center p-6">
        <div className="text-amber-600 text-4xl mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading is taking longer than expected</h3>
        <p className="text-gray-600 mb-4">Please check your internet connection</p>
        <button 
          onClick={() => {
            setIsLoading(true);
            setHasTimedOut(false);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return isLoading ? <>{fallback}</> : <>{children}</>;
}

// Button with loading state
export function LoadingButton({ 
  isLoading, 
  children, 
  loadingText = 'Loading...', 
  className = '', 
  disabled,
  ...props 
}: {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  return (
    <button 
      className={`relative ${className} ${isLoading || disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" color="white" />
          <span className="ml-2">{loadingText}</span>
        </div>
      )}
      <div className={isLoading ? 'invisible' : ''}>
        {children}
      </div>
    </button>
  );
}

// Retry mechanism component
export function RetryWrapper({ 
  children, 
  onRetry, 
  error, 
  maxRetries = 3,
  retryDelay = 1000 
}: {
  children: React.ReactNode;
  onRetry: () => Promise<void>;
  error?: Error | null;
  maxRetries?: number;
  retryDelay?: number;
}) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (retryCount >= maxRetries) return;
    
    setIsRetrying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      await onRetry();
      setRetryCount(0);
    } catch (error) {
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  };

  if (error && !isRetrying) {
    return (
      <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-500 text-4xl mb-2">❌</div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">Something went wrong</h3>
        <p className="text-red-700 mb-4">{error.message}</p>
        
        {retryCount < maxRetries ? (
          <div>
            <LoadingButton
              isLoading={isRetrying}
              onClick={handleRetry}
              loadingText="Retrying..."
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 mr-2"
            >
              Retry ({maxRetries - retryCount} left)
            </LoadingButton>
            <span className="text-sm text-red-600">
              Attempt {retryCount + 1} of {maxRetries}
            </span>
          </div>
        ) : (
          <div>
            <p className="text-red-600 font-semibold mb-2">Maximum retry attempts reached</p>
            <a 
              href="https://wa.me/61415957027" 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-block"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Support
            </a>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

// Smooth loading transitions
export function FadeInLoader({ 
  isLoading, 
  children, 
  fallback 
}: {
  isLoading: boolean;
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  return (
    <div className="transition-opacity duration-300">
      {isLoading ? (
        <div className="animate-pulse">
          {fallback}
        </div>
      ) : (
        <div className="animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

// Progress indicator
export function ProgressIndicator({ 
  current, 
  total, 
  showPercentage = true 
}: {
  current: number;
  total: number;
  showPercentage?: boolean;
}) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{percentage}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Step {current}</span>
        <span>of {total}</span>
      </div>
    </div>
  );
}