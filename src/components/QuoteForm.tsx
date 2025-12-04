'use client'

import { useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { getUniqueModels, getStorageOptions } from '@/data/iphones'

const damageOptions = [
  { id: 'screen_damage', label: 'Screen damage or Face ID issues' },
  { id: 'back_glass', label: 'Back glass cracked' },
  { id: 'camera_damage', label: 'Camera damage' },
  { id: 'charging_port', label: 'Charging port issues' },
  { id: 'battery_issues', label: 'Battery issues (poor battery life)' }
]

interface FormData {
  name: string
  phone: string
  email: string
  suburb: string
  model: string
  storage: string
  issues: string[]
}

export default function QuoteForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    suburb: '',
    model: '',
    storage: '',
    issues: []
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
      <div className="bg-success/5 border border-success/20 rounded-brand p-8 text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-headline text-heading mb-2">Thanks for your interest!</h3>
        <p className="text-body">We'll call you with a quote within 24 hours.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-headline text-heading">Your Details</h3>

        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="John Smith"
            className="w-full px-4 py-3 bg-surface border border-border rounded-brand focus-ring text-body"
          />
          {errors.name && <p className="mt-1 text-sm text-danger">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            placeholder="0412 345 678"
            className="w-full px-4 py-3 bg-surface border border-border rounded-brand focus-ring text-body"
          />
          {errors.phone && <p className="mt-1 text-sm text-danger">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            placeholder="john@example.com"
            className="w-full px-4 py-3 bg-surface border border-border rounded-brand focus-ring text-body"
          />
          {errors.email && <p className="mt-1 text-sm text-danger">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Suburb *
          </label>
          <input
            type="text"
            value={formData.suburb}
            onChange={(e) => updateFormData('suburb', e.target.value)}
            placeholder="Penrith"
            className="w-full px-4 py-3 bg-surface border border-border rounded-brand focus-ring text-body"
          />
          {errors.suburb && <p className="mt-1 text-sm text-danger">{errors.suburb}</p>}
        </div>
      </div>

      {/* Phone Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-headline text-heading">iPhone Details</h3>

        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            iPhone Model *
          </label>
          <div className="relative">
            <select
              value={formData.model}
              onChange={(e) => updateFormData('model', e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-border rounded-brand appearance-none focus-ring text-body"
            >
              <option value="">Select iPhone model</option>
              {models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body/50 pointer-events-none" />
          </div>
          {errors.model && <p className="mt-1 text-sm text-danger">{errors.model}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Storage *
          </label>
          <div className="relative">
            <select
              value={formData.storage}
              onChange={(e) => updateFormData('storage', e.target.value)}
              disabled={!formData.model}
              className="w-full px-4 py-3 bg-surface border border-border rounded-brand appearance-none focus-ring text-body disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select storage size</option>
              {storageOptions.map(storage => (
                <option key={storage} value={storage}>{storage}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body/50 pointer-events-none" />
          </div>
          {errors.storage && <p className="mt-1 text-sm text-danger">{errors.storage}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-heading mb-3">
            Known Issues (optional)
          </label>
          <div className="space-y-2">
            {damageOptions.map(issue => (
              <label key={issue.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.issues.includes(issue.id)}
                  onChange={() => toggleIssue(issue.id)}
                  className="w-4 h-4 text-primary focus-ring rounded border-border"
                />
                <span className="ml-2 text-sm text-body">{issue.label}</span>
              </label>
            ))}
          </div>
          {formData.issues.length > 0 && (
            <p className="mt-2 text-sm text-accent">
              {formData.issues.length} issue{formData.issues.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-white px-6 py-3 rounded-brand font-button hover:bg-primary/90 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
        <div className="bg-danger/5 border border-danger/20 rounded-brand p-4">
          <p className="text-sm text-danger">{errors.general}</p>
        </div>
      )}
    </form>
  )
}
