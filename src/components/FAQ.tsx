'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How quickly can you pick up my iPhone?',
    answer: 'We offer same-day pickup if you request before 3 PM and you\'re within 20 km of our hub in Penrith. Otherwise, we can usually schedule pickup within 24-48 hours during our operating hours (12 PM - 8 PM, Monday to Saturday).'
  },
  {
    question: 'What should I bring when you arrive?',
    answer: 'Just your iPhone and a valid ID. If you have the original box and charger, bring those too (we deduct $20 each if they\'re missing). Make sure to back up any important data beforehand as we\'ll wipe the device after purchase.'
  },
  {
    question: 'When do I get paid?',
    answer: 'Payment is made immediately upon successful inspection and agreement on the final price. We offer cash on the spot or instant PayID transfer to your bank account.'
  },
  {
    question: 'What if my iPhone has accessory issues?',
    answer: 'Missing original box or charger results in a $20 deduction each. However, this is already factored into your online quote when you indicate what accessories you have.'
  },
  {
    question: 'How do you wipe my personal data?',
    answer: 'We perform a complete factory reset and data wipe following industry standards. However, we recommend you back up important data and sign out of all accounts (iCloud, iTunes, etc.) before our arrival.'
  },
  {
    question: 'How long is my quote valid?',
    answer: 'Online quotes are valid for 7 days from generation. The final payout is subject to physical inspection and may vary if the device condition differs from what was indicated online.'
  },
  {
    question: 'What happens during the inspection?',
    answer: 'Our technician will verify the model, storage, and condition of your device. We check functionality, screen condition, cameras, buttons, and other components. The inspection usually takes 2-3 minutes.'
  },
  {
    question: 'Do you visit private residences after hours?',
    answer: 'For safety reasons, we don\'t visit private residences after 9 PM. Late pickups can be arranged at public locations like shopping centers or our Penrith drop-off location.'
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="max-w-container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-section-mobile md:text-section-desktop font-headline text-heading mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-body max-w-2xl mx-auto">
            Got questions? We&apos;ve got answers. If you don&apos;t see what you&apos;re looking for, give us a call.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-card rounded-brand border border-border">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between focus-ring"
                >
                  <span className="font-medium text-heading pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 text-body transition-transform flex-shrink-0 ${
                      openIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-body leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}