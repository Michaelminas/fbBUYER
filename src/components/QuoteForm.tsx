'use client'

import { useState } from 'react'
import { ChevronDown, Loader2, Phone, Mail, MapPin, User } from 'lucide-react'
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
  const [step, setStep] = useState(1)
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

    // Auto-advance on model selection
    if (field === 'model' && value && step === 1) {
      setTimeout(() => setStep(2), 300)
    }

    // Auto-advance on storage selection
    if (field === 'storage' && value && step === 2) {
      setTimeout(() => setStep(3), 300)
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
        <h3 className="text-xl font-headline text-heading mb-2">Thanks {formData.name}!</h3>
        <p className="text-body mb-4">We'll call you with a quote within 24 hours.</p>
        <p className="text-sm text-body/70">
          Check your email at <strong>{formData.email}</strong> for confirmation.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= num
                  ? 'bg-primary text-white'
                  : 'bg-surface border-2 border-border text-body/50'
              }`}
            >
              {num}
            </div>
            {num < 4 && (
              <div
                className={`flex-1 h-1 mx-2 transition-colors ${
                  step > num ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Model Selection */}
        {step >= 1 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-heading mb-2">
              Which iPhone do you have? *
            </label>
            <div className="relative">
              <select
                value={formData.model}
                onChange={(e) => updateFormData('model', e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-border rounded-brand appearance-none focus-ring text-body text-lg"
              >
                <option value="">Select your iPhone model</option>
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body/50 pointer-events-none" />
            </div>
            {errors.model && <p className="mt-1 text-sm text-danger">{errors.model}</p>}
          </div>
        )}

        {/* Step 2: Storage Selection */}
        {step >= 2 && formData.model && (
          <div className="space-y-4 animate-fadeIn">
            <label className="block text-sm font-medium text-heading mb-2">
              Storage capacity? *
            </label>
            <div className="relative">
              <select
                value={formData.storage}
                onChange={(e) => updateFormData('storage', e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-border rounded-brand appearance-none focus-ring text-body text-lg"
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
        )}

        {/* Step 3: Issues (Optional) */}
        {step >= 3 && formData.storage && (
          <div className="space-y-4 animate-fadeIn">
            <label className="block text-sm font-medium text-heading mb-3">
              Any known issues? (Optional)
            </label>
            <div className="space-y-2 bg-surface p-4 rounded-brand border border-border">
              {damageOptions.map(issue => (
                <label key={issue.id} className="flex items-center hover:bg-surface/50 p-2 rounded transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.issues.includes(issue.id)}
                    onChange={() => toggleIssue(issue.id)}
                    className="w-4 h-4 text-primary focus-ring rounded border-border"
                  />
                  <span className="ml-3 text-sm text-body">{issue.label}</span>
                </label>
              ))}
            </div>
            {formData.issues.length > 0 && (
              <p className="text-sm text-accent">
                ✓ {formData.issues.length} issue{formData.issues.length !== 1 ? 's' : ''} selected
              </p>
            )}

            {!formData.name && (
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full bg-primary text-white px-6 py-3 rounded-brand font-button hover:bg-primary/90 transition-colors focus-ring"
              >
                Continue
              </button>
            )}
          </div>
        )}

        {/* Step 4: Contact Details */}
        {step >= 4 && (
          <div className="space-y-4 animate-fadeIn pt-4 border-t border-border">
            <h3 className="text-lg font-headline text-heading mb-4">Almost done! Your contact details:</h3>

            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body/50" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Your name"
                className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-brand focus-ring text-body"
              />
            </div>
            {errors.name && <p className="text-sm text-danger">{errors.name}</p>}

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body/50" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="Phone number"
                className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-brand focus-ring text-body"
              />
            </div>
            {errors.phone && <p className="text-sm text-danger">{errors.phone}</p>}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body/50" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="Email address"
                className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-brand focus-ring text-body"
              />
            </div>
            {errors.email && <p className="text-sm text-danger">{errors.email}</p>}

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-body/50" />
              <input
                type="text"
                value={formData.suburb}
                onChange={(e) => updateFormData('suburb', e.target.value)}
                placeholder="Your suburb"
                className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-brand focus-ring text-body"
              />
            </div>
            {errors.suburb && <p className="text-sm text-danger">{errors.suburb}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-success text-white px-6 py-4 rounded-brand font-button text-lg hover:bg-success/90 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Get My Quote'
              )}
            </button>
          </div>
        )}

        {errors.general && (
          <div className="bg-danger/5 border border-danger/20 rounded-brand p-4">
            <p className="text-sm text-danger">{errors.general}</p>
          </div>
        )}
      </form>
    </div>
  )
}
