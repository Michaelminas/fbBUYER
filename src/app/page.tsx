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
                Instant quote. Friendly pickup or easy drop-off in Penrith.
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
                Subject to inspection. Quote valid for 7 days.
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
                    <h3 className="font-medium text-gray-900 mb-1">Get your instant quote</h3>
                    <p className="text-gray-600 text-sm">Select your iPhone model and condition for an immediate price estimate.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-4">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Verify & schedule pickup or drop-off</h3>
                    <p className="text-gray-600 text-sm">Confirm your details and choose a convenient time via our calendar.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-4">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">We inspect and pay on the spot</h3>
                    <p className="text-gray-600 text-sm">Quick inspection and immediate payment via cash or bank transfer.</p>
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
                  <p className="text-sm text-gray-700">"Quick and easy process. Got my quote and cash same day!"</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="text-yellow-400">★★★★★</div>
                    <span className="ml-2 text-sm text-gray-600">David L.</span>
                  </div>
                  <p className="text-sm text-gray-700">"Fair prices and professional service. Highly recommend!"</p>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div id="faq" className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <details className="bg-white p-4 rounded-lg border border-gray-200">
                  <summary className="font-medium text-gray-900 cursor-pointer">How quickly do you pick up?</summary>
                  <p className="mt-2 text-sm text-gray-600">Same-day pickup available within 20km if requested before 3:00pm. All other pickups within 24-48 hours during our operating hours (12:00-20:00).</p>
                </details>
                <details className="bg-white p-4 rounded-lg border border-gray-200">
                  <summary className="font-medium text-gray-900 cursor-pointer">What should I bring?</summary>
                  <p className="mt-2 text-sm text-gray-600">Just your iPhone and any accessories (box, charger) you mentioned in the quote. We'll handle everything else including data wipe guidance.</p>
                </details>
                <details className="bg-white p-4 rounded-lg border border-gray-200">
                  <summary className="font-medium text-gray-900 cursor-pointer">When do I get paid?</summary>
                  <p className="mt-2 text-sm text-gray-600">Payment is made immediately after inspection via cash, bank transfer, or PayID - your choice!</p>
                </details>
                <details className="bg-white p-4 rounded-lg border border-gray-200">
                  <summary className="font-medium text-gray-900 cursor-pointer">What if my quote changes?</summary>
                  <p className="mt-2 text-sm text-gray-600">Your verified quote is honored for 7 days. Price may only change if device condition differs from what was declared during inspection.</p>
                </details>
                <details className="bg-white p-4 rounded-lg border border-gray-200">
                  <summary className="font-medium text-gray-900 cursor-pointer">Is it safe to meet privately?</summary>
                  <p className="mt-2 text-sm text-gray-600">For safety, we don't visit private residences after 9pm. We recommend meeting at public places like shopping centers or cafés for evening pickups.</p>
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
