import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const services = [
  {
    title: 'Custom Software Development',
    description: 'Scalable, high-performance software tailored to your business operations',
    features: ['Web Apps', 'Business Systems', 'SaaS Platforms'],
    link: '/services',
  },
  {
    title: 'Business Automation',
    description: 'Intelligent systems that save time, reduce errors, and improve efficiency',
    features: ['Workflows', 'CRM', 'Booking Systems'],
    link: '/services',
  },
  {
    title: 'System Integration',
    description: 'Connect your tools and platforms into one seamless ecosystem',
    features: ['APIs', 'Tool Connections', 'Data Sync'],
    link: '/services',
  },
  {
    title: 'AI & Intelligent Solutions',
    description: 'AI-powered tools to improve decisions, automate tasks, and enhance customer experience',
    features: ['AI Automation', 'Chatbots', 'Smart Systems'],
    link: '/services',
  },
]

export default function ServicesSection() {
  return (
    <section className="py-48 bg-white">
      <div className="container mx-auto px-8 max-w-7xl">
        <div className="text-center mb-40">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
            Our Services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive digital solutions tailored to grow your business.
          </p>
        </div>

        <div className="space-y-0">
          {services.map((service, index) => {
            const bgColors = [
              'hover:bg-blue-50/40',
              'hover:bg-amber-50/40',
              'hover:bg-emerald-50/40',
              'hover:bg-purple-50/40'
            ]

            return (
              <div
                key={index}
                className={`group relative overflow-hidden bg-white py-28 px-16 md:py-40 md:px-28 transition-all duration-700 ease-out ${bgColors[index]} border-t border-gray-200 first:border-t-0 hover:py-36 md:hover:py-52`}
              >
                <div className="grid md:grid-cols-[160px_1fr] gap-16 md:gap-24 items-start max-w-6xl">
                  {/* Number */}
                  <div className="flex-shrink-0">
                    <span className="text-3xl md:text-4xl font-light text-gray-400 group-hover:text-gray-500 transition-colors duration-500">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-10">
                    {/* Title */}
                    <h3 className="text-4xl md:text-5xl font-medium text-gray-900 leading-tight transition-all duration-500">
                      {service.title}
                    </h3>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 text-base text-gray-500 font-light">
                      {service.features.map((feature, i) => (
                        <span key={i} className="inline-flex items-center">
                          {i > 0 && <span className="mx-3">•</span>}
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Description - Expands on hover */}
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-700 ease-out">
                      <div className="overflow-hidden">
                        <p className="text-lg text-gray-600 leading-relaxed max-w-3xl pt-6 pb-10">
                          {service.description}
                        </p>
                      </div>
                    </div>

                    {/* Button - Appears on hover */}
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-700 ease-out delay-100">
                      <div className="overflow-hidden">
                        <Link href={service.link}>
                          <button className="inline-flex items-center gap-3 px-10 py-4 rounded-full border border-gray-900 bg-transparent text-gray-900 font-normal text-sm uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all duration-300 group/btn mt-2">
                            Discuss Project
                            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}