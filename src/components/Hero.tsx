'use client'

import QuoteForm from './QuoteForm'

export default function Hero() {
  return (
    <section className="bg-surface py-12 md:py-20">
      <div className="max-w-container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Hero Content */}
          <div className="order-2 lg:order-1">
            <div className="max-w-xl">
              <h1 className="text-hero-mobile md:text-hero-desktop font-headline text-heading mb-6">
                Cash For Phones Today
              </h1>
              
              <p className="text-lg text-body mb-8">
                Instant quote. Friendly pickup or easy drop-off in Penrith.
              </p>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm text-body">Fast payout</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm text-body">Licensed recycler</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm text-body">Secure & friendly</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm text-body">Cash or Bank Transfer/PayID</span>
                </div>
              </div>

              {/* Disclosure */}
              <p className="text-sm text-body/70">
                Subject to inspection. Quote valid for 7 days.
              </p>

              {/* Mobile CTA - only shown on small screens when quote form is below */}
              <button className="w-full lg:hidden mt-8 bg-primary text-white px-8 py-3 rounded-brand font-button hover:bg-primary/90 transition-colors focus-ring">
                Get my instant quote ↓
              </button>
            </div>
          </div>

          {/* Right Column - Quote Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-card rounded-brand-lg shadow-lg p-6 md:p-8 border border-border">
              <h2 className="text-card-title font-headline text-heading mb-6 text-center">
                Get Your Quote
              </h2>
              <QuoteForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}