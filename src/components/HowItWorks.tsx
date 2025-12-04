import { Calculator, Mail, Calendar, DollarSign } from 'lucide-react'

const steps = [
  {
    icon: Calculator,
    title: 'Get your instant quote',
    description: 'Select your iPhone model, storage, and condition for an immediate price estimate.'
  },
  {
    icon: Mail,
    title: 'Verify & schedule pickup or drop-off',
    description: 'Confirm your email and choose a convenient time slot from our calendar.'
  },
  {
    icon: DollarSign,
    title: 'We inspect and pay on the spot',
    description: 'Our friendly team inspects your device and pays you immediately in cash or PayID.'
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="max-w-container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-section-mobile md:text-section-desktop font-headline text-heading mb-4">
            How it works
          </h2>
          <p className="text-lg text-body max-w-2xl mx-auto">
            Get paid for your iPhone in three simple steps. No haggling, no waiting around.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              
              <div className="mb-2 flex items-center justify-center space-x-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-white text-sm font-medium rounded-full">
                  {index + 1}
                </span>
                <h3 className="text-card-title font-headline text-heading">
                  {step.title}
                </h3>
              </div>
              
              <p className="text-body">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}