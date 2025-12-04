import { Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-heading text-card py-12">
      <div className="max-w-container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Business Details */}
          <div>
            <h3 className="font-headline text-lg mb-4">SellPhones.sydney</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>1 Brushwood Street<br />Claremont Meadows NSW 2747</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>0415 957 027</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>hello@sellphones.sydney</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-headline mb-4">Contact</h4>
            <div className="space-y-2 text-sm">
              <p>Contact 24/7</p>
              <p>Bookable window: 12:00–20:00</p>
              <p>Monday to Saturday</p>
              <a 
                href="https://wa.me/61415957027" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-2 text-primary hover:text-primary/80 transition-colors"
              >
                WhatsApp →
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-headline mb-4">Information</h4>
            <div className="space-y-2 text-sm">
              <a href="#how-it-works" className="block hover:text-primary transition-colors">
                How it works
              </a>
              <a href="#reviews" className="block hover:text-primary transition-colors">
                Reviews
              </a>
              <a href="#faq" className="block hover:text-primary transition-colors">
                FAQ
              </a>
              <a href="/privacy" className="block hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="block hover:text-primary transition-colors">
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-card/20 pt-8">
          <div className="text-center text-sm opacity-75">
            <p>© 2025 SellPhones.sydney. Licensed phone recycler servicing Sydney.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}