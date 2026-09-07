import React from 'react';
import { Header } from '../components/Header';
import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  return (
    <div className="bg-[#FAF6F0] min-h-screen font-sans text-gray-800">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#45055B] mb-4">Privacy Policy</h1>
        <p className="text-gray-500 mb-1">Effective Date: August 23, 2026</p>
        <p className="text-gray-500 mb-10">Last Updated: August 23, 2026</p>

        <div className="prose prose-sm md:prose-base prose-blue max-w-none text-gray-700 space-y-6">
          <p>
            LYDIA GLOBAL EXIM (“LYDIA GLOBAL EXIM,” “we,” “us,” or “our”) respects your privacy and is committed to protecting the personal information you provide when you visit or use our website, create an account, place an order, contact us, or otherwise interact with our products and services.
          </p>
          <p>
            This Privacy Policy explains what personal information we collect, how we collect and use it, when we share it, how we protect it, how long we retain it, and the choices and rights that may be available to you.
          </p>
          <p>
            Our website is intended for individuals 13 years of age or older. We do not knowingly permit individuals under 13 to create accounts or purchase products directly through our website.
          </p>
          <p>
            By using our website, you acknowledge this Privacy Policy. Where applicable law requires consent for a particular use of personal information, we will obtain the required consent.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">1. Who We Are</h2>
          <p>
            LYDIA GLOBAL EXIM is an online e-commerce business offering exquisite imitation jewelry, fashion jewelry, Kundan sets, CZ pieces, temple ornaments, and anti-tarnish micro-gold plated collections through its online store and global sales channels.
          </p>
          <p>
            For privacy-related questions or requests, please contact us using the information provided in the Contact Us section of this Privacy Policy.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">2. Age Requirement</h2>
          <p>Our website is intended for users who are 13 years of age or older.</p>
          <p>
            You must be at least 13 years old to create an LYDIA GLOBAL EXIM customer account or knowingly provide personal information to us through account registration.
          </p>
          <p>
            If you are under 13, please do not create an account, place an order, or provide personal information through our website.
          </p>
          <p>
            If we learn that we have collected personal information from an individual under 13 without the legally required parental consent, we will take reasonable steps to delete that information in accordance with applicable law.
          </p>
          
          <h3 className="text-lg font-bold text-[#45055B] mt-6 mb-2">Teen Users</h3>
          <p>
            Individuals between 13 and 17 years of age may use the website subject to our <Link to="/terms-of-service" className="text-brand-gold underline font-semibold">Terms & Conditions</Link> and applicable law.
          </p>
          <p>
            We encourage parents and guardians to discuss online privacy and safe shopping practices with teenagers.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">3. Personal Information We Collect</h2>
          <p>Depending on how you interact with LYDIA GLOBAL EXIM, we may collect the following categories of personal information:</p>

          <h3 className="text-lg font-bold text-[#45055B] mt-6 mb-2">A. Account Information</h3>
          <p>When you create an LYDIA GLOBAL EXIM account, we may collect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>First and last name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Password or authentication information</li>
            <li>Account preferences and saved addresses</li>
            <li>Communication preferences</li>
          </ul>

          <h3 className="text-lg font-bold text-[#45055B] mt-6 mb-2">B. Shipping and Billing Information</h3>
          <p>When you place an order, we collect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Customer and recipient name</li>
            <li>Shipping and billing addresses (including house/apartment number, street, city, state, postal/PIN code)</li>
            <li>Active contact phone number</li>
            <li>Delivery instructions</li>
          </ul>

          <h3 className="text-lg font-bold text-[#45055B] mt-6 mb-2">C. Order and Purchase Information</h3>
          <p>We collect order records, including products purchased, quantities, order date, order value, applied coupon discounts, order delivery status, and communication history.</p>

          <h3 className="text-lg font-bold text-[#45055B] mt-6 mb-2">D. Payment Information</h3>
          <p>
            Payments are processed securely via third-party payment gateways (e.g., Razorpay, UPI, Net Banking, Card Providers). LYDIA GLOBAL EXIM does not store full credit/debit card numbers, CVVs, or banking credentials on our servers.
          </p>

          <h3 className="text-lg font-bold text-[#45055B] mt-6 mb-2">E. Customer Communications & Inquiries</h3>
          <p>When you reach out via email, WhatsApp, or contact forms, we collect your messages, inquiry details, unboxing proof videos/photos (for claims), and feedback to assist you.</p>

          <h3 className="text-lg font-bold text-[#45055B] mt-6 mb-2">F. Device & Usage Information</h3>
          <p>When you browse our website, technical data such as IP address, browser type, device information, visited pages, session duration, and cookies may be collected automatically to maintain website stability and security.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">4. How We Collect Personal Information</h2>
          <p>We collect personal information directly from you when you register, place an order, fill out inquiry forms, reach out via WhatsApp/email, or interact with our website via secure cookies and analytics services.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">5. How We Use Personal Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Process, package, and deliver your jewelry orders</li>
            <li>Send order confirmations, shipment tracking updates, and delivery alerts</li>
            <li>Provide customer support, address inquiries, and process policy claims</li>
            <li>Maintain account security and prevent fraudulent transactions</li>
            <li>Send optional promotional updates and new collection announcements (which you can unsubscribe from at any time)</li>
            <li>Comply with applicable legal, accounting, and tax requirements</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">6. Cookies and Tracking Technologies</h2>
          <p>We use essential cookies and session storage to keep you logged in, save items in your shopping bag, and remember your site preferences. You can adjust your browser settings to limit cookies, though some website features may require them to function smoothly.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">7. How We Share Personal Information</h2>
          <p>We do not sell your personal data. We share information only with trusted service partners strictly as needed to fulfill our services:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Logistics & Courier Partners:</strong> To dispatch and deliver your packages directly to your address.</li>
            <li><strong>Payment Processors:</strong> To facilitate secure, encrypted online payments.</li>
            <li><strong>Cloud Infrastructure & Hosting:</strong> To ensure high-speed, reliable, and secure site operations.</li>
            <li><strong>Legal & Regulatory Authorities:</strong> When required by valid law or legal process.</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">8. Data Security</h2>
          <p>We implement administrative, technical, and physical safeguards designed to protect personal information against unauthorized access, loss, or alteration. All web interactions are secured with SSL/TLS encryption.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">9. Data Retention</h2>
          <p>We retain personal information for as long as necessary to maintain your customer account, fulfill orders, process warranties/claims, prevent fraud, and satisfy statutory tax and business recordkeeping obligations.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">10. Your Privacy Choices & Rights</h2>
          <p>You have the right to access, update, or request deletion of your account information. You may update your profile details directly from the Account Dashboard or contact our support team for assistance.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">11. International Visitors & Data Transfers</h2>
          <p>
            LYDIA GLOBAL EXIM serves customers across domestic and international locations. If you access our website from outside our primary operating country, your personal information may be processed and stored securely on cloud servers and service infrastructure operated by our technology providers. We take appropriate measures to ensure your data remains protected in compliance with this Privacy Policy.
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">12. Changes to This Privacy Policy</h2>
          <p>We may periodically update this Privacy Policy to reflect business or regulatory changes. Any updates will be posted on this page with an updated "Last Updated" date.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">13. Contact Us</h2>
          <p>If you have any questions or privacy requests regarding your personal information, please contact us:</p>
          <div className="bg-white p-5 rounded-2xl border border-brand-gold/20 space-y-2 text-sm not-prose">
            <p className="font-bold text-[#45055B] text-base">LYDIA GLOBAL EXIM</p>
            <p className="text-gray-700"><strong>Address:</strong> H.No. 3-6-555/7, 1st Floor, Nizampet Road, Kukatpally, Hyderabad - 500072, Telangana, India.</p>
            <p className="text-gray-700"><strong>Privacy Email:</strong> <a href="mailto:lydiaglobalexim@gmail.com" className="text-brand-gold underline font-semibold">lydiaglobalexim@gmail.com</a></p>
            <p className="text-gray-700"><strong>WhatsApp / Phone:</strong> <a href="tel:9014863411" className="text-brand-gold underline font-semibold">+91 9014863411</a></p>
            <p className="text-gray-700"><strong>Operating Hours:</strong> Monday – Saturday, 9:00 AM – 6:00 PM IST</p>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">14. Your Acknowledgment</h2>
          <p>By using the LYDIA GLOBAL EXIM website, you acknowledge that you have reviewed and agree to this Privacy Policy alongside our <Link to="/terms-of-service" className="text-brand-gold underline font-semibold">Terms & Conditions</Link>.</p>
        </div>
      </div>
    </div>
  );
}

