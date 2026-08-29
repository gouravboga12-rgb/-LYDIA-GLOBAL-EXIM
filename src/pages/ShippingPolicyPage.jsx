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
      'All orders are processed within 1–3 business days (Monday through Saturday, excluding public holidays).',
      'You will receive an order confirmation email immediately after placing your order.',
      'A shipping confirmation email with your tracking number is sent once your order has been dispatched.',
      'Orders placed after 5:00 PM CST will be processed the next business day.',
    ],
  },
  {
    id: 'delivery',
    icon: <Truck className="w-6 h-6 text-brand-gold" />,
    title: 'Delivery Timeline',
    badge: '1-3 Business Days',
    badgeColor: 'bg-blue-100 text-blue-700',
    content: [
      'Standard delivery takes 1-3 business days after dispatch, depending on your location within USA.',
      'Remote or rural areas may require an additional 1-3 business days beyond the standard timeline.',
      'We do not currently offer express shipping, but we are actively working to bring faster options.',
      'Delivery timelines may vary during peak seasons or festival periods.',
      'Once an order has been handed over to the shipping carrier, carrier-related delays may be outside LYDIA GLOBAL EXIM\'s control.',
    ],
  },
  {
    id: 'coverage',
    icon: <MapPin className="w-6 h-6 text-brand-gold" />,
    title: 'Shipping Coverage',
    badge: 'Pan USA + Select International',
    badgeColor: 'bg-purple-100 text-purple-700',
    content: [
      'We ship to all zip codes across USA through our trusted logistics partners.',
      'International shipping is available to select countries — please contact us before placing your international order.',
      'For international orders, additional customs duties or import taxes may apply depending on your country.',
      'Contact us at lydiaglobalexim@gmail.com or WhatsApp +91 9014863411 for international shipping rates.',
    ],
  },
  {
    id: 'packaging',
    icon: <Package className="w-6 h-6 text-brand-gold" />,
    title: 'Premium Packaging',
    badge: 'Gift-Ready',
    badgeColor: 'bg-amber-100 text-amber-700',
    content: [
      'Every LYDIA GLOBAL EXIM order is packed in premium, branded packaging designed to protect your items during transit.',
      'Our packaging is eco-friendly and gift-ready — perfect for gifting a loved one right out of the box.',
      'We use extra cushioning for delicate pieces to ensure they arrive in perfect condition.',
      'A beautiful thank-you card is included with every order.',
    ],
  },
  {
    id: 'tracking',
    icon: <ShieldCheck className="w-6 h-6 text-brand-gold" />,
    title: 'Order Tracking',
    badge: 'Real-Time Updates',
    badgeColor: 'bg-rose-100 text-rose-700',
    content: [
      'Once shipped, you will receive a tracking number via email and/or SMS to monitor your order in real time.',
      'You can also track your order directly from "My Orders" in your account dashboard.',
      'If your shipment is delayed beyond 7 business days, please contact us immediately for assistance.',
      'We are happy to coordinate with our logistics partners to resolve any delivery issues promptly.',
    ],
  },
  {
    id: 'signature',
    icon: <ShieldCheck className="w-6 h-6 text-brand-gold" />,
    title: 'Signature Confirmation',
    badge: 'Optional',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    content: [
      'Customers may choose Signature Confirmation at checkout for an additional fee, where available. This service requires a signature upon delivery and may provide additional security for the shipment.',
      'If Signature Confirmation is not selected, the order will be shipped using the standard delivery service without a signature requirement. The carrier may leave the package at the delivery address or in another location according to its delivery procedures.',
      'Once a package is marked as successfully delivered by the carrier, LYDIA GLOBAL EXIM is not responsible for packages that are lost, stolen, or misplaced after delivery. We recommend selecting Signature Confirmation for higher-value orders or locations where packages may be left unattended.',
      'Signature requirements and delivery procedures are subject to the selected carrier’s terms and conditions.',
    ],
  },
  {
    id: 'insurance',
    icon: <ShieldCheck className="w-6 h-6 text-brand-gold" />,
    title: 'Shipping Insurance & Claims',
    badge: 'Recommended',
    badgeColor: 'bg-teal-100 text-teal-700',
    content: [
      'Additional shipping insurance may be available at checkout for an additional fee. If additional insurance is not selected, default carrier liability will apply, subject to the carrier’s terms and conditions.',
      '1. Default Carrier Liability: Most eligible shipping services include limited carrier liability coverage, generally up to $100. For a package confirmed lost or damaged, the customer is responsible for filing the claim with the carrier. LYDIA GLOBAL EXIM will assist by providing relevant order information.',
      '2. Additional Shipping Insurance: May provide broader protection for eligible shipments, including loss, damage, or theft. Protection beyond standard carrier liability is subject to the provider’s terms and exclusions.',
      'Important: All insurance claims are subject to the applicable carrier or insurance provider’s terms. LYDIA GLOBAL EXIM is not responsible for losses or damages beyond the applicable carrier liability or insurance coverage.',
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
            { label: 'Coverage', value: 'Pan USA' },
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
              <p className="text-white/50 text-sm mb-5 leading-relaxed">We're here to help with any shipping concerns.</p>
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
                  <p className="text-xs text-brand-dark-blue/40 font-semibold uppercase tracking-widest">Email</p>
                  <p className="text-brand-dark-blue/80 text-sm mt-0.5">lydiaglobalexim@gmail.com</p>
                </div>
                <div>
                  <p className="text-xs text-brand-dark-blue/40 font-semibold uppercase tracking-widest">WhatsApp</p>
                  <p className="text-brand-dark-blue/80 text-sm mt-0.5">+91 9014863411</p>
                </div>
                <div>
                  <p className="text-xs text-brand-dark-blue/40 font-semibold uppercase tracking-widest">Hours</p>
                  <p className="text-brand-dark-blue/80 text-sm mt-0.5">Mon–Sat, 9AM – 6PM CST</p>
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
