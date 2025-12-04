'use client'

import { useState } from 'react'
import { Phone, Contrast } from 'lucide-react'

export default function Header() {
  const [highContrast, setHighContrast] = useState(false)

  const toggleHighContrast = () => {
    setHighContrast(!highContrast)
    document.documentElement.classList.toggle('high-contrast')
  }

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-headline text-heading">
              SellPhones.sydney
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#how-it-works" 
              className="text-body hover:text-primary transition-colors focus-ring rounded px-2 py-1"
            >
              How it works
            </a>
            <a 
              href="#reviews" 
              className="text-body hover:text-primary transition-colors focus-ring rounded px-2 py-1"
            >
              Reviews
            </a>
            <a 
              href="#faq" 
              className="text-body hover:text-primary transition-colors focus-ring rounded px-2 py-1"
            >
              FAQ
            </a>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* WhatsApp Contact */}
            <a
              href="https://wa.me/61415957027"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-body hover:text-primary transition-colors focus-ring rounded px-2 py-1"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">0415 957 027</span>
            </a>

            {/* High Contrast Toggle */}
            <button
              onClick={toggleHighContrast}
              className={`p-2 rounded-brand border transition-colors focus-ring ${
                highContrast 
                  ? 'bg-heading text-card border-heading' 
                  : 'bg-surface text-body border-border hover:border-primary'
              }`}
              aria-label="Toggle high contrast mode"
              title="Toggle high contrast mode"
            >
              <Contrast className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}