'use client'

import { useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
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

  const validateForm = (): boolean => {
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
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
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-headline text-heading mb-2">Thanks {formData.name}!</h3>
        <p className="text-body mb-2">We'll call you with a quote within 24 hours.</p>
        <p className="text-sm text-body/70">Check your email for confirmation.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* iPhone Model */}
      <div>
        <label className="block text-sm font-medium text-heading mb-2">
          iPhone Model *
        </label>
        <div className="relative">
          <select
            value={formData.model}
            onChange={(e) => updateFormData('model', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-brand appearance-none focus-ring text-body"
          >
            <option value="">Search iPhone model (e.g., iPhone 13 Pro)</option>
            {models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body/50 pointer-events-none" />
        </div>
        {errors.model && <p className="mt-1 text-xs text-danger">{errors.model}</p>}
      </div>

      {/* Storage */}
      {formData.model && (
        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Storage *
          </label>
          <div className="relative">
            <select
              value={formData.storage}
              onChange={(e) => updateFormData('storage', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-brand appearance-none focus-ring text-body"
            >
              <option value="">Select storage size</option>
              {storageOptions.map(storage => (
                <option key={storage} value={storage}>{storage}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body/50 pointer-events-none" />
          </div>
          {errors.storage && <p className="mt-1 text-xs text-danger">{errors.storage}</p>}
        </div>
      )}

      {/* Damage Assessment */}
      <div>
        <label className="block text-sm font-medium text-heading mb-2">
          Known Issues (Optional)
        </label>
        <div className="space-y-3 max-h-64 overflow-y-auto border border-border rounded-brand p-3">
          {Object.entries(damageOptions).map(([category, issues]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-body/80 mb-1">{category}</h4>
              <div className="space-y-1">
                {issues.map(issue => (
                  <label key={issue.id} className="flex items-center hover:bg-surface/50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.issues.includes(issue.id)}
                      onChange={() => toggleIssue(issue.id)}
                      className="rounded border-border text-primary focus-ring"
                    />
                    <span className="ml-2 text-sm text-body">{issue.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sell Method */}
      <div>
        <label className="block text-sm font-medium text-heading mb-2">
          Sell Method *
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="sellMethod"
              checked={formData.sellMethod === 'pickup'}
              onChange={() => updateFormData('sellMethod', 'pickup')}
              className="border-border text-primary focus-ring"
            />
            <span className="ml-2 text-sm text-body">Pickup</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="sellMethod"
              checked={formData.sellMethod === 'dropoff'}
              onChange={() => updateFormData('sellMethod', 'dropoff')}
              className="border-border text-primary focus-ring"
            />
            <span className="ml-2 text-sm text-body">Drop-off (Penrith)</span>
          </label>
        </div>
      </div>

      {/* Pickup Address */}
      {formData.sellMethod === 'pickup' && (
        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Pickup Address *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateFormData('address', e.target.value)}
            placeholder="Enter your address or nearby location"
            className="w-full px-3 py-2 border border-border rounded-brand focus-ring text-body"
          />
          <p className="text-xs text-body/70 mt-1">
            Pickup is free if travel cost is under $20; otherwise capped at $30–$50.
          </p>
        </div>
      )}

      {/* Contact Details */}
      <div className="border-t border-border pt-4 space-y-3">
        <h3 className="text-sm font-medium text-heading">Your Contact Details</h3>

        <div>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="Your name *"
            className="w-full px-3 py-2 border border-border rounded-brand focus-ring text-body"
          />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
        </div>

        <div>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            placeholder="Phone number *"
            className="w-full px-3 py-2 border border-border rounded-brand focus-ring text-body"
          />
          {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone}</p>}
        </div>

        <div>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            placeholder="Email address *"
            className="w-full px-3 py-2 border border-border rounded-brand focus-ring text-body"
          />
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email}</p>}
        </div>

        <div>
          <input
            type="text"
            value={formData.suburb}
            onChange={(e) => updateFormData('suburb', e.target.value)}
            placeholder="Your suburb *"
            className="w-full px-3 py-2 border border-border rounded-brand focus-ring text-body"
          />
          {errors.suburb && <p className="text-xs text-danger mt-1">{errors.suburb}</p>}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !formData.model || !formData.storage}
        className="w-full bg-primary text-white py-3 px-4 rounded-brand font-button hover:bg-primary/90 transition-colors focus-ring disabled:bg-body/30 disabled:cursor-not-allowed flex items-center justify-center"
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
        <div className="bg-danger/5 border border-danger/20 rounded-brand p-3">
          <p className="text-sm text-danger">{errors.general}</p>
        </div>
      )}
    </form>
  )
}
