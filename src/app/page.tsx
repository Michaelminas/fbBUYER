import QuoteCalculator from '@/components/QuoteCalculator';
import { Metadata } from 'next';
import { 
  generatePageMetadata,
  generateLocalBusinessSchema,
  generateFAQSchema,
  SEO_KEYWORDS 
} from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: "Sell iPhone Sydney - Cash For Phones Today - Instant Quote & Free Pickup",
  description: "Sydney's #1 iPhone buyer! Get instant quotes, free pickup, and cash on the spot. 7-day quote validity, same-day service. Licensed recycler serving all Sydney areas.",
  keywords: [
    ...SEO_KEYWORDS.primary,
    ...SEO_KEYWORDS.secondary,
    ...SEO_KEYWORDS.locations.slice(0, 5) // Include top locations
  ]
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="font-bold text-xl text-gray-900">
              SellPhones.sydney
            </div>
            <div className="flex items-center space-x-6">
              <a href="tel:+61415957027" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                +61 415 957 027
              </a>
              <nav className="hidden md:flex space-x-6">
                <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">How it works</a>
                <a href="#reviews" className="text-sm text-gray-600 hover:text-gray-900">Reviews</a>
                <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Left Column - Hero and Info */}
          <div className="order-2 lg:order-1">
            {/* Hero Section */}
            <div className="mb-12">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Cash For Phones Today
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Get a quote within 24 hours. Friendly service across Sydney.
              </p>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center">
                  <span className="text-green-600 mr-1">✓</span>
                  Fast payout
                </span>
                <span className="flex items-center">
                  <span className="text-green-600 mr-1">✓</span>
                  Licensed recycler
                </span>
                <span className="flex items-center">
                  <span className="text-green-600 mr-1">✓</span>
                  Secure & friendly
                </span>
                <span className="flex items-center">
                  <span className="text-green-600 mr-1">✓</span>
                  Cash or Bank Transfer/PayID
                </span>
              </div>
              
              <p className="text-sm text-gray-500">
                We'll call you back with a competitive quote.
              </p>
            </div>

            {/* How it Works */}
            <div id="how-it-works" className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">How it works</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-4">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Tell us about your iPhone</h3>
                    <p className="text-gray-600 text-sm">Select your iPhone model and let us know about any damage or issues.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-4">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">We'll call you with a quote</h3>
                    <p className="text-gray-600 text-sm">Our team will contact you within 24 hours with a competitive offer.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-4">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Get paid fast</h3>
                    <p className="text-gray-600 text-sm">Accept the offer and receive payment via cash or bank transfer.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Preview */}
            <div id="reviews" className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Customer Reviews</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="text-yellow-400">★★★★★</div>
                    <span className="ml-2 text-sm text-gray-600">Sarah M.</span>
                  </div>
                  <p className="text-sm text-gray-700">"Called me back within hours with a great offer. Very professional!"</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="text-yellow-400">★★★★★</div>
                    <span className="ml-2 text-sm text-gray-600">David L.</span>
                  </div>
                  <p className="text-sm text-gray-700">"Best price I got for my iPhone. Quick response and easy process!"</p>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div id="faq" className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <details className="bg-white p-4 rounded-lg border border-gray-200">
                  <summary className="font-medium text-gray-900 cursor-pointer">How quickly will I get a quote?</summary>
                  <p className="mt-2 text-sm text-gray-600">We aim to call you back within 24 hours with a competitive quote for your iPhone.</p>
                </details>
                <details className="bg-white p-4 rounded-lg border border-gray-200">
                  <summary className="font-medium text-gray-900 cursor-pointer">What information do I need to provide?</summary>
                  <p className="mt-2 text-sm text-gray-600">Just tell us your iPhone model, storage size, and any damage or issues. We'll also need your contact details so we can call you back.</p>
                </details>
                <details className="bg-white p-4 rounded-lg border border-gray-200">
                  <summary className="font-medium text-gray-900 cursor-pointer">Do you offer pickup or drop-off?</summary>
                  <p className="mt-2 text-sm text-gray-600">We'll discuss pickup or drop-off options when we call you with the quote. Service available across Sydney.</p>
                </details>
                <details className="bg-white p-4 rounded-lg border border-gray-200">
                  <summary className="font-medium text-gray-900 cursor-pointer">What payment methods do you accept?</summary>
                  <p className="mt-2 text-sm text-gray-600">We offer cash, bank transfer, or PayID - whatever works best for you!</p>
                </details>
                <details className="bg-white p-4 rounded-lg border border-gray-200">
                  <summary className="font-medium text-gray-900 cursor-pointer">Is my information secure?</summary>
                  <p className="mt-2 text-sm text-gray-600">Yes, we take your privacy seriously. Your contact information is only used to provide you with a quote and is kept completely confidential.</p>
                </details>
              </div>
            </div>
          </div>

          {/* Right Column - Quote Calculator (Mobile First) */}
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <QuoteCalculator />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">SellPhones.sydney</h3>
              <p className="text-gray-600 text-sm mb-2">Phone: 0415 957 027</p>
              <p className="text-gray-600 text-sm mb-2">Location: Penrith Area, NSW</p>
              <p className="text-gray-600 text-sm">Contact 24/7</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="https://wa.me/61415957027" className="block text-sm text-gray-600 hover:text-gray-900">WhatsApp</a>
                <a href="mailto:support@sellphones.sydney" className="block text-sm text-gray-600 hover:text-gray-900">Email</a>
                <a href="#faq" className="block text-sm text-gray-600 hover:text-gray-900">FAQ</a>
                <a href="/privacy" className="block text-sm text-gray-600 hover:text-gray-900">Privacy</a>
                <a href="/terms" className="block text-sm text-gray-600 hover:text-gray-900">Terms</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateLocalBusinessSchema()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFAQSchema()),
        }}
      />
    </div>
  );
}
