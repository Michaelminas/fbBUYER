'use client'

import { useState } from 'react'
import { Loader2, ChevronDown } from 'lucide-react'
import { getUniqueModels, getStorageOptions } from '@/data/iphones'

const damageOptions = {
  'Screen & Face ID': [
    { id: 'screen_damage', label: 'Screen (scratches/cracks)' },
    { id: 'touch_issues', label: 'Touch issues' },
    { id: 'face_id', label: 'Face ID/TrueDepth' }
  ],
  'Back & Cameras': [
    { id: 'back_glass', label: 'Back glass' },
    { id: 'rear_camera', label: 'Rear camera' },
    { id: 'front_camera', label: 'Front camera' }
  ],
  'Other Issues': [
    { id: 'buttons', label: 'Buttons' },
    { id: 'charging_port', label: 'Charging/Port' },
    { id: 'battery_issues', label: 'Battery condition' },
    { id: 'speakers', label: 'Microphones/Speakers' },
    { id: 'water_damage', label: 'Water/Liquid exposure' },
    { id: 'wont_power_on', label: 'Won\'t power on' },
    { id: 'motherboard', label: 'Motherboard/logic board issue' },
    { id: 'activation_locked', label: 'Activation/IC-locked' }
  ]
}

interface FormData {
  name: string
  phone: string
  email: string
  suburb: string
  model: string
  storage: string
  issues: string[]
  sellMethod: 'pickup' | 'dropoff'
  address: string
}

export default function QuoteForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    suburb: '',
    model: '',
    storage: '',
    issues: [],
    sellMethod: 'pickup',
    address: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const models = getUniqueModels()
  const storageOptions = formData.model ? getStorageOptions(formData.model) : []

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset storage when model changes
      ...(field === 'model' && { storage: '' })
    }))

    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleIssue = (issueId: string) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.includes(issueId)
        ? prev.issues.filter(d => d !== issueId)
        : [...prev.issues, issueId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.suburb.trim()) newErrors.suburb = 'Suburb is required'
    if (!formData.model) newErrors.model = 'iPhone model is required'
    if (!formData.storage) newErrors.storage = 'Storage size is required'

    // Basic email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      setIsSubmitted(true)
    } catch (error) {
      setErrors({ general: 'Unable to submit form. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show thank you message after submission
  if (isSubmitted) {
    return (
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
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* iPhone Model */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1.5">
          iPhone Model *
        </label>
        <div className="relative">
          <select
            value={formData.model}
            onChange={(e) => updateFormData('model', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md appearance-none bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select iPhone model (e.g. iPhone 13 Pro)</option>
            {models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {errors.model && <p className="mt-1 text-xs text-red-600">{errors.model}</p>}
      </div>

      {/* Storage - Only show if model is selected */}
      {formData.model && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Storage *
          </label>
          <div className="space-y-2">
            {storageOptions.map(storage => (
              <label key={storage} className="flex items-center">
                <input
                  type="radio"
                  name="storage"
                  value={storage}
                  checked={formData.storage === storage}
                  onChange={(e) => updateFormData('storage', e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{storage}</span>
              </label>
            ))}
          </div>
          {errors.storage && <p className="mt-1 text-xs text-red-600">{errors.storage}</p>}
        </div>
      )}

      {/* Damage Assessment */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Damage Assessment
        </label>
        <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
          {Object.entries(damageOptions).map(([category, issues]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-gray-600 mb-1.5">{category}</h4>
              <div className="space-y-1.5">
                {issues.map(issue => (
                  <label key={issue.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.issues.includes(issue.id)}
                      onChange={() => toggleIssue(issue.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{issue.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sell Method */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Sell Method *
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="sellMethod"
              value="pickup"
              checked={formData.sellMethod === 'pickup'}
              onChange={(e) => updateFormData('sellMethod', e.target.value as 'pickup' | 'dropoff')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Pickup - (Capped at $30-$50)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="sellMethod"
              value="dropoff"
              checked={formData.sellMethod === 'dropoff'}
              onChange={(e) => updateFormData('sellMethod', e.target.value as 'pickup' | 'dropoff')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Drop-off (Penrith)</span>
          </label>
        </div>
      </div>

      {/* Pickup Address */}
      {formData.sellMethod === 'pickup' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Pickup Address *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateFormData('address', e.target.value)}
            placeholder="Enter your address or nearby location"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            If the pickup travel cost is under $20, delivery or pickup is free; otherwise, capped at $30–$50 total.
          </p>
        </div>
      )}

      {/* Your Contact Details */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Your Contact Details</h3>

        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Your name *"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              placeholder="Phone number *"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="Email address *"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <input
              type="text"
              value={formData.suburb}
              onChange={(e) => updateFormData('suburb', e.target.value)}
              placeholder="Your suburb *"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.suburb && <p className="text-xs text-red-600 mt-1">{errors.suburb}</p>}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          'Get Quote'
        )}
      </button>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}
    </form>
  )
}
