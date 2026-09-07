import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '../components/Header';
import { Truck, Clock, MapPin, Package, ShieldCheck, ChevronDown } from 'lucide-react';

const sections = [
  {
    id: 'processing',
    icon: <Clock className="w-6 h-6 text-brand-gold" />,
    title: 'Processing Time',
    badge: '1–3 Business Days',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    content: [
      'All orders are processed and packed within 1–3 business days (Monday through Saturday, excluding public holidays).',
      'You will receive an order confirmation email immediately after placing your order.',
      'A shipping confirmation email with your live tracking number is sent once your parcel has been dispatched.',
      'Orders placed after 5:00 PM IST will begin processing the next business day.',
    ],
  },
  {
    id: 'delivery',
    icon: <Truck className="w-6 h-6 text-brand-gold" />,
    title: 'Delivery Timeline',
    badge: '3–7 Business Days',
    badgeColor: 'bg-blue-100 text-blue-700',
    content: [
      'Standard delivery typically takes 3–7 business days after dispatch, depending on your delivery location and PIN code.',
      'Remote or rural locations may require an additional 1–2 business days beyond the standard timeline.',
      'International shipments typically arrive within 7–14 business days depending on customs clearance.',
      'Delivery timelines may vary during peak festival seasons or national holidays.',
      'Once an order has been handed over to the shipping carrier, carrier-related delays due to weather or transit disruptions are outside LYDIA GLOBAL EXIM\'s direct control.',
    ],
  },
  {
    id: 'coverage',
    icon: <MapPin className="w-6 h-6 text-brand-gold" />,
    title: 'Shipping Coverage',
    badge: 'Pan India & Worldwide',
    badgeColor: 'bg-purple-100 text-purple-700',
    content: [
      'We ship across all PIN codes in India through our premier express courier and logistics partners.',
      'International shipping is available to select destinations worldwide — please contact us before placing international orders for shipping assistance.',
      'For international orders, destination customs duties or import taxes may apply depending on your local regulations.',
      'Contact us at lydiaglobalexim@gmail.com or WhatsApp +91 9014863411 for international delivery inquiries.',
    ],
  },
  {
    id: 'packaging',
    icon: <Package className="w-6 h-6 text-brand-gold" />,
    title: 'Export-Grade Premium Packaging',
    badge: 'Gift-Ready',
    badgeColor: 'bg-amber-100 text-amber-700',
    content: [
      'Every LYDIA GLOBAL EXIM order is securely packed in premium, tamper-evident branded packaging engineered to protect delicate jewelry during transit.',
      'Our packaging is elegant and gift-ready — perfect for personal enjoyment or gifting.',
      'We use multi-layer shock cushioning for fragile and stone-studded jewelry pieces.',
      'A jewelry care guide is included with every order to help keep your items shining.',
    ],
  },
  {
    id: 'tracking',
    icon: <ShieldCheck className="w-6 h-6 text-brand-gold" />,
    title: 'Real-Time Order Tracking',
    badge: 'Live Updates',
    badgeColor: 'bg-rose-100 text-rose-700',
    content: [
      'Once dispatched, tracking details with carrier link will be sent to your registered email and/or SMS/WhatsApp.',
      'You can also track your shipment live directly under "My Orders" from your account dashboard.',
      'If your parcel experiences unexpected transit delays, our support team will actively coordinate with the courier partner to expedite delivery.',
    ],
  },
  {
    id: 'insurance',
    icon: <ShieldCheck className="w-6 h-6 text-brand-gold" />,
    title: 'Transit Safety & Damage Claims',
    badge: 'Protected',
    badgeColor: 'bg-teal-100 text-teal-700',
    content: [
      'All shipments are dispatched via verified logistics providers with standard transit protection.',
      'In the rare event of transit damage or missing items, LYDIA GLOBAL EXIM provides full replacement or refund support when verified with a mandatory unboxing video.',
      'To file a transit damage or missing item claim, record a single uncut unboxing video upon delivery and contact us within 7 days.',
    ],
  },
];

function AccordionItem({ section, isOpen, toggle }) {
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-brand-gold/40 shadow-md' : 'border-brand-gold/15 shadow-sm'}`}>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 bg-white text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-brand-dark-blue flex items-center justify-center shrink-0">
            {section.icon}
          </div>
          <div>
            <h3 className="font-bold text-brand-dark-blue text-base md:text-lg">{section.title}</h3>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 inline-block ${section.badgeColor}`}>
              {section.badge}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-brand-dark-blue/40 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden bg-brand-beige"
      >
        <ul className="px-5 md:px-6 py-5 space-y-3 border-t border-brand-gold/10">
          {section.content.map((line, i) => (
            <li key={i} className="flex items-start gap-3 text-brand-dark-blue/70 text-sm leading-relaxed">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
              {line}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

export function ShippingPolicyPage() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="bg-brand-beige min-h-screen pb-20 md:pb-12 font-sans">
      <Header title="Shipping Policy" />

      {/* Hero */}
      <div className="bg-brand-dark-blue">
        <div className="px-4 md:px-24 py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="font-bold tracking-widest uppercase text-xs mb-4" style={{ color: '#C6A184' }}>Legal</p>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight mb-4">
              Shipping Policy
            </h1>
            <div className="w-20 h-1.5 rounded-full mb-6" style={{ background: '#C6A184' }}></div>
            <p className="text-white/60 text-base md:text-lg leading-relaxed">
              We want your LYDIA GLOBAL EXIM experience to be seamless from purchase to delivery. Everything you need to know about how we ship.
            </p>
            <p className="text-white/30 text-xs mt-4">Last updated: August 23, 2026</p>
          </motion.div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 md:px-24 -mt-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 py-8">
          {[
            { label: 'Processing', value: '1–3 Days' },
            { label: 'Delivery', value: '3–7 Days' },
            { label: 'Coverage', value: 'India & Global' },
            { label: 'Packaging', value: 'Gift-Ready' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-brand-gold/20 rounded-2xl p-4 md:p-5 text-center shadow-sm"
            >
              <p className="text-xl md:text-2xl font-serif font-bold text-brand-gold">{s.value}</p>
              <p className="text-brand-dark-blue/60 text-xs md:text-sm font-semibold mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

          {/* Accordion Sections */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-serif font-bold text-brand-dark-blue mb-6">Policy Details</h2>
            {sections.map((section, i) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <AccordionItem
                  section={section}
                  isOpen={openIdx === i}
                  toggle={() => setOpenIdx(openIdx === i ? -1 : i)}
                />
              </motion.div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-24">
            {/* Need help */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-brand-dark-blue rounded-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-brand-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Got a Question?</h3>
              <p className="text-white/50 text-sm mb-5 leading-relaxed">We're here to help with any shipping or tracking questions.</p>
              <a href="https://wa.me/919014863411" target="_blank" rel="noopener noreferrer"
                className="block w-full bg-brand-gold text-brand-dark-blue font-bold py-3 rounded-xl text-sm hover:bg-brand-gold/80 transition-all">
                Chat on WhatsApp
              </a>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-brand-gold/20 rounded-2xl p-6 space-y-4"
            >
              <h3 className="font-bold text-brand-dark-blue text-lg">Contact Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-brand-dark-blue/40 font-semibold uppercase tracking-widest">Office Address</p>
                  <p className="text-brand-dark-blue/80 text-xs mt-0.5 leading-relaxed">H.No. 3-6-555/7, 1st Floor, Nizampet Road, Kukatpally, Hyderabad - 500072, Telangana, India.</p>
                </div>
                <div>
                  <p className="text-xs text-brand-dark-blue/40 font-semibold uppercase tracking-widest">Email</p>
                  <p className="text-brand-dark-blue/80 text-sm mt-0.5">lydiaglobalexim@gmail.com</p>
                </div>
                <div>
                  <p className="text-xs text-brand-dark-blue/40 font-semibold uppercase tracking-widest">WhatsApp / Phone</p>
                  <p className="text-brand-dark-blue/80 text-sm mt-0.5">+91 9014863411</p>
                </div>
                <div>
                  <p className="text-xs text-brand-dark-blue/40 font-semibold uppercase tracking-widest">Hours</p>
                  <p className="text-brand-dark-blue/80 text-sm mt-0.5">Mon–Sat, 9AM – 6PM IST</p>
                </div>
              </div>
            </motion.div>

            {/* Related */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="bg-brand-beige border border-brand-gold/20 rounded-2xl p-6"
            >
              <h3 className="font-bold text-brand-dark-blue text-base mb-4">Related Policies</h3>
              <a href="/returns-policy" className="flex items-center justify-between py-3 border-b border-brand-gold/10 text-sm text-brand-dark-blue/70 hover:text-brand-gold transition-colors">
                Returns & Exchanges <span>→</span>
              </a>
              <a href="/terms-of-service" className="flex items-center justify-between py-3 border-b border-brand-gold/10 text-sm text-brand-dark-blue/70 hover:text-brand-gold transition-colors">
                Terms & Conditions <span>→</span>
              </a>
              <a href="/contact#faq-section" className="flex items-center justify-between pt-3 text-sm text-brand-dark-blue/70 hover:text-brand-gold transition-colors">
                FAQs <span>→</span>
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
