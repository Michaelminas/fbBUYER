import { Star } from 'lucide-react'

const reviews = [
  {
    name: 'Sarah M.',
    location: 'Penrith',
    rating: 5,
    text: 'Quick and professional. Got my quote online and they picked up my iPhone 13 the same day. Cash in hand within minutes!'
  },
  {
    name: 'David K.',
    location: 'Blacktown',
    rating: 5,
    text: 'Fair price for my cracked iPhone 12 Pro. Much easier than dealing with Facebook Marketplace time-wasters.'
  },
  {
    name: 'Emma L.',
    location: 'Parramatta',
    rating: 5,
    text: 'Honest assessment and exactly the price they quoted online. Will definitely use again.'
  },
  {
    name: 'Michael R.',
    location: 'St Marys',
    rating: 5,
    text: 'Driver was punctual and friendly. Whole process took less than 10 minutes at my door.'
  },
  {
    name: 'Lisa T.',
    location: 'Mount Druitt',
    rating: 5,
    text: 'Great service! They were upfront about the condition issues and price was still competitive.'
  },
  {
    name: 'James W.',
    location: 'Kingswood',
    rating: 5,
    text: 'Sold my iPhone 14 Pro Max hassle-free. The online quote was accurate and pickup was super convenient.'
  }
]

export default function Reviews() {
  return (
    <section id="reviews" className="py-16 md:py-24 bg-surface">
      <div className="max-w-container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-section-mobile md:text-section-desktop font-headline text-heading mb-4">
            What our customers say
          </h2>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-body font-medium">4.9/5 from 247 reviews</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div key={index} className="bg-card rounded-brand p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-heading">{review.name}</h4>
                  <p className="text-sm text-body/70">{review.location}</p>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${
                        star <= review.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-border'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              
              <p className="text-body">"{review.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}