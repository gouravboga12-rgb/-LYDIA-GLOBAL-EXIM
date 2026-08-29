import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

function CountUp({ end, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
            else setCount(end);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const WHATSAPP_NUMBER = '919014863411';

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.subject.trim()) e.subject = true;
    if (!form.message.trim()) e.message = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const text = `*New Message from LYDIA GLOBAL EXIM Website*%0A%0A*Name:* ${encodeURIComponent(form.name)}%0A*Email:* ${encodeURIComponent(form.email || 'Not provided')}%0A*Subject:* ${encodeURIComponent(form.subject)}%0A%0A*Message:*%0A${encodeURIComponent(form.message)}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    setSent(true);
  };

  const inputClass = (key) =>
    `w-full px-4 py-3 rounded-xl border bg-brand-beige focus:outline-none focus:ring-2 transition-shadow text-brand-dark-blue placeholder:text-brand-dark-blue/30 ${
      errors[key] ? 'border-red-400 focus:ring-red-300' : 'border-brand-gold/20 focus:ring-brand-gold/40'
    }`;

  if (sent) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h3 className="text-xl font-bold text-brand-dark-blue">WhatsApp Opened!</h3>
      <p className="text-brand-dark-blue/60 text-sm">Your message has been pre-filled in WhatsApp. Just hit send!</p>
      <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
        className="text-sm font-bold text-brand-gold underline mt-2">Send another message</button>
    </div>
  );

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-semibold text-brand-dark-blue mb-1.5">Full Name *</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className={inputClass('name')} placeholder="Your Name" />
        {errors.name && <p className="text-xs text-red-500 mt-1">Name is required</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-brand-dark-blue mb-1.5">Email Address <span className="text-brand-dark-blue/40 font-normal">(optional)</span></label>
        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className={inputClass('email')} placeholder="your@email.com" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-brand-dark-blue mb-1.5">Subject *</label>
        <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          className={inputClass('subject')} placeholder="How can we help?" />
        {errors.subject && <p className="text-xs text-red-500 mt-1">Subject is required</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-brand-dark-blue mb-1.5">Message *</label>
        <textarea rows="4" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          className={inputClass('message') + ' resize-none'} placeholder="Write your message here..." />
        {errors.message && <p className="text-xs text-red-500 mt-1">Message is required</p>}
      </div>
      <motion.button type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-brand-dark-blue text-brand-gold font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all mt-2"
      >
        Send via WhatsApp
        <Send className="w-5 h-5" />
      </motion.button>
    </form>
  );
}

export function ContactPage() {
  const { hash } = useLocation();
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (hash === '#faq-section') {
      // Delay to ensure the DOM is fully rendered before scrolling
      const timer = setTimeout(() => {
        const el = document.getElementById('faq-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [hash]);

  return (
    <div className="bg-brand-beige min-h-screen pb-20 md:pb-12 font-sans">
      <Header title="Contact Us" />

      {/* Hero Banner */}
      <div className="px-4 md:px-24 pt-12 md:pt-16 pb-10 md:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h4 className="text-brand-gold font-bold tracking-widest uppercase text-xs md:text-sm mb-3">We're Here to Help</h4>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark-blue leading-tight mb-4">
            Get in Touch
          </h1>
          <div className="w-20 h-1.5 bg-brand-gold rounded-full mb-6"></div>
          <p className="text-brand-dark-blue/70 max-w-xl text-base md:text-lg leading-relaxed">
            Whether you have a question about our jewelry, need help with an order, or just want to say hello — our team is always ready to assist you.
          </p>
        </motion.div>
      </div>

      {/* Contact Cards + Form */}
      <div className="px-4 md:px-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6 h-full"
          >
            {/* Location */}
            <div className="bg-white border border-brand-gold/20 rounded-2xl p-6 flex items-start gap-5 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-brand-dark-blue flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="font-bold text-brand-dark-blue text-lg mb-1">Our Location</h3>
                <p className="text-brand-dark-blue/70 text-sm leading-relaxed">Dallas, Texas</p>
                <p className="text-brand-dark-blue/40 text-xs mt-1">Home-based boutique</p>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white border border-brand-gold/20 rounded-2xl p-6 flex items-start gap-5 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-brand-dark-blue flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="font-bold text-brand-dark-blue text-lg mb-1">Phone & WhatsApp</h3>
                <p className="text-brand-dark-blue/70 text-sm">+91 9014863411</p>
                <p className="text-brand-dark-blue/40 text-xs mt-1">Mon–Sat, 9:00 AM – 6:00 PM</p>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white border border-brand-gold/20 rounded-2xl p-6 flex items-start gap-5 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-brand-dark-blue flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="font-bold text-brand-dark-blue text-lg mb-1">Email Address</h3>
                <p className="text-brand-dark-blue/70 text-sm">lydiaglobalexim@gmail.com</p>
                <p className="text-brand-dark-blue/40 text-xs mt-1">We typically reply within 24 hours</p>
              </div>
            </div>

            {/* Social Links - flex-grow so it fills remaining height */}
            <div className="bg-brand-dark-blue rounded-2xl p-6 shadow-sm flex-grow flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-brand-gold text-lg mb-4">Connect With Us</h3>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                  </div>
                </div>
              </div>
              <p className="text-white/30 text-xs mt-6">Reach out for personalized jewelry recommendations 💛</p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white border border-brand-gold/20 rounded-[24px] shadow-lg p-8 md:p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-gold to-brand-dark-blue rounded-t-[24px]"></div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-dark-blue mb-2">Send us a Message</h2>
            <p className="text-brand-dark-blue/60 text-sm mb-8">Fill in the form and we'll get back to you shortly.</p>

<ContactForm />
          </motion.div>

        </div>
      </div>

      {/* Quick Contact Banners */}
      <div className="px-4 md:px-24 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* WhatsApp Premium Banner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-[32px] p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl transition-all duration-500"
          >
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2A0845] to-[#3B0764] z-0"></div>
            <div className="absolute -right-20 -top-20 w-72 h-72 bg-brand-gold/20 rounded-full blur-3xl z-0 group-hover:bg-brand-gold/30 transition-all duration-700"></div>
            <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl z-0 group-hover:scale-110 transition-all duration-700"></div>
            
            <div className="relative z-10 flex items-center gap-5 w-full sm:w-auto justify-center sm:justify-start text-center sm:text-left">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-[#25D366] drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-brand-gold text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Fastest Response</span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-1">WhatsApp</h3>
                <p className="text-white/60 text-sm hidden sm:block font-medium">Instant replies & recommendations</p>
              </div>
            </div>
            
            <a
              href="https://wa.me/919014863411"
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 shrink-0 w-full sm:w-auto text-center bg-[#25D366] text-white font-bold py-4 px-8 rounded-2xl shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:shadow-[0_0_30px_rgba(37,211,102,0.6)] transition-all duration-300 text-sm md:text-base flex items-center justify-center gap-2 group-hover:bg-[#1db354]"
            >
              Message Us
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </motion.div>

          {/* Email Support Premium Banner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-[32px] p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl transition-all duration-500"
          >
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0f172a] z-0 opacity-95"></div>
            <div className="absolute -right-20 -top-20 w-72 h-72 bg-brand-gold/20 rounded-full blur-3xl z-0 group-hover:bg-brand-gold/30 transition-all duration-700"></div>
            <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-brand-gold/10 rounded-full blur-3xl z-0 group-hover:scale-110 transition-all duration-700"></div>
            
            <div className="relative z-10 flex items-center gap-5 w-full sm:w-auto justify-center sm:justify-start text-center sm:text-left">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <Mail className="w-8 h-8 md:w-10 md:h-10 text-brand-gold drop-shadow-lg" />
              </div>
              <div className="flex flex-col">
                <span className="text-brand-gold text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 opacity-90">Official Email</span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-1">Email Us</h3>
                <p className="text-white/80 text-sm hidden sm:block font-medium">lydiaglobalexim@gmail.com</p>
              </div>
            </div>
            
            <a
              href="mailto:lydiaglobalexim@gmail.com"
              className="relative z-10 shrink-0 w-full sm:w-auto text-center bg-brand-gold text-brand-dark-blue font-bold py-4 px-8 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all duration-300 text-sm md:text-base flex items-center justify-center gap-2 hover:bg-[#e0be53]"
            >
              Send Email
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </motion.div>
          
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq-section" className="bg-brand-beige py-20 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-dark-blue/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
        
        <div className="px-4 md:px-24 relative z-10">
          <div className="text-center mb-16">
            <span className="text-brand-gold font-bold uppercase tracking-widest text-sm mb-3 block">Got Questions?</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-brand-dark-blue mb-5">Frequently Asked Questions</h2>
            <p className="text-brand-dark-blue/60 max-w-2xl mx-auto">Find quick answers to common questions about our products, shipping, returns, and store policies.</p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {[
              { 
                category: 'Materials & Finish',
                q: 'What materials are used in your imitation jewelry?', 
                a: 'Our imitation jewelry is crafted with jeweler-grade brass and copper alloys, finished with 18K/22K micro gold electroplating, antique matte polish, and sealed with a protective anti-tarnish lacquer. We use high-grade AAA+ Cubic Zirconia, authentic Kundan, synthetic pearls, and faceted crystals.' 
              },
              { 
                category: 'Skin Safety',
                q: 'Is your imitation jewelry safe for sensitive skin?', 
                a: 'Yes, 100%! All our imitation jewelry is completely lead-free, nickel-free, and hypoallergenic. It is safe for sensitive skin and will not cause irritation or green discoloration when worn.' 
              },
              { 
                category: 'Durability & Care',
                q: 'How do I care for and maintain my imitation jewelry?', 
                a: 'Always put your jewelry on after applying perfumes, lotions, and makeup. Avoid direct contact with water, chemical sprays, and sweat. After wearing, gently wipe with a dry, soft microfiber cloth and store individually in airtight zip-lock pouches.' 
              },
              { 
                category: 'Longevity',
                q: 'How long does the gold polish and stone shine last?', 
                a: 'With standard care and dry storage, our micro-plated imitation jewelry retains its radiant luster, vibrant polish, and tight stone setting for years of festive and daily wear.' 
              },
              { 
                category: 'Shipping & Delivery',
                q: 'How long does shipping take?', 
                a: 'We securely box and dispatch all orders within 1–2 business days. Standard delivery across India takes 3–5 business days, while international export shipping typically arrives in 5–9 business days.' 
              },
              { 
                category: 'Bulk & Export Orders',
                q: 'Do you offer bridal sets, wholesale, or export bulk orders?', 
                a: 'Yes! As Lydia Global Exim, we specialize in worldwide export shipments, boutique supplies, and bridal collections. Contact us directly via WhatsApp (+91 9014863411) for wholesale pricing and catalog access.' 
              },
              { 
                category: 'Damages & Replacements',
                q: 'What if an item is damaged during transit?', 
                a: 'We pack every order in heavy-duty cushioned packaging. In the rare event of transit damage, please provide an unboxing video and message our WhatsApp support within 48 hours for an instant replacement or refund.' 
              },
              { 
                category: 'Payments & Security',
                q: 'What payment methods do you accept?', 
                a: 'We accept all major domestic and international Credit/Debit cards, UPI, Net Banking, and secure online payment gateways with 256-bit SSL encryption.' 
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white border border-brand-gold/15 rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === i ? 'shadow-lg ring-1 ring-brand-gold/30' : 'hover:shadow-md hover:border-brand-gold/30'}`}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${openFaq === i ? 'bg-brand-gold text-white' : 'bg-brand-gold/10 text-brand-gold'}`}>
                      <span className="text-sm font-bold">Q</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider mb-1 block opacity-80">{faq.category}</span>
                      <h4 className={`font-bold text-[15px] md:text-base transition-colors duration-300 ${openFaq === i ? 'text-brand-gold' : 'text-brand-dark-blue'}`}>{faq.q}</h4>
                    </div>
                  </div>
                  <div className={`shrink-0 ml-4 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}>
                    <svg className={`w-5 h-5 ${openFaq === i ? 'text-brand-gold' : 'text-brand-dark-blue/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-6 pb-6 pt-2 ml-12 border-t border-gray-50">
                    <p className="text-brand-dark-blue/70 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-brand-dark-blue/60 text-sm mb-4">Still have questions?</p>
            <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); }} className="inline-block px-6 py-2 bg-white border border-brand-dark-blue/10 rounded-full text-brand-dark-blue text-sm font-bold hover:bg-brand-gold hover:text-white hover:border-brand-gold transition-all duration-300 shadow-sm">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
