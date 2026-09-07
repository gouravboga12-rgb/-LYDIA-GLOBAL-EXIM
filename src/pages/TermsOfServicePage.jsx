import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';

export function TermsOfServicePage() {
  return (
    <div className="bg-[#FAF6F0] min-h-screen font-sans text-gray-800">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#45055B] mb-4">Terms & Conditions</h1>
        <p className="text-gray-500 mb-1">Effective Date: August 23, 2026</p>
        <p className="text-gray-500 mb-10">Last Updated: August 23, 2026</p>

        <div className="prose prose-sm md:prose-base prose-blue max-w-none text-gray-700 space-y-6">
          <p>Welcome to LYDIA GLOBAL EXIM.</p>
          <p>These Terms & Conditions (“Terms,” “Terms & Conditions”) govern your access to and use of the LYDIA GLOBAL EXIM website, including browsing the website, creating an account, placing orders, purchasing products, and using other services provided through our website.</p>
          <p>By accessing or using the website, creating an account, or placing an order, you agree to be bound by these Terms & Conditions and our Privacy Policy.</p>
          <p>If you do not agree with these Terms, please do not use our website or place an order.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">1. About LYDIA GLOBAL EXIM</h2>
          <p>LYDIA GLOBAL EXIM (“LYDIA GLOBAL EXIM,” “we,” “us,” or “our”) operates an e-commerce platform offering premium handcrafted imitation jewelry, fashion jewelry, Kundan sets, CZ collections, temple jewelry, anti-tarnish micro-gold plated pieces, and related accessories.</p>
          <p>These Terms apply to all purchases, inquiries, and transactions made through our website unless otherwise stated.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">2. Eligibility</h2>
          <p>Our website is intended for individuals 13 years of age or older.</p>
          <p>By creating an account or placing an order, you confirm that you are at least 13 years old and have the legal capacity to enter into these Terms.</p>
          <p>If you are under 13 years of age, you may not create an account or knowingly provide personal information through our website.</p>
          <p>If you are between 13 and 17 years old, you should use the website with the guidance and consent of a parent or legal guardian.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">3. Account Registration</h2>
          <p>Certain features of our website may require you to create an account. When creating an account, you agree to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide accurate, truthful, and current information</li>
            <li>Maintain the accuracy of your account information</li>
            <li>Keep your account login credentials strictly confidential</li>
            <li>Not share your password or OTP with unauthorized individuals</li>
            <li>Notify us immediately if you suspect unauthorized access to your account</li>
            <li>Remain responsible for all activities occurring under your account</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that contain inaccurate information, violate these Terms, or engage in fraudulent or abusive activities.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">4. Product Information & Accuracy</h2>
          <p>We make every reasonable effort to display product descriptions, photographs, colors, dimensions, craftsmanship, and materials as accurately as possible. However:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Colors and luster may appear slightly different depending on your screen settings, monitor calibration, or lighting.</li>
            <li>Handcrafted jewelry items may feature minor artisanal variations that make each piece unique.</li>
            <li>Product dimensions, weights, and specifications may be subject to minor manufacturing tolerances.</li>
          </ul>
          <p>All items are imitation and fashion jewelry crafted with quality alloys and anti-tarnish protective plating unless explicitly designated otherwise.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">5. Product Availability</h2>
          <p>All products are subject to stock availability. We reserve the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Limit quantities on any order or item</li>
            <li>Discontinue products or collections at any time</li>
            <li>Modify product designs or specifications</li>
            <li>Correct catalog errors and pricing discrepancies</li>
            <li>Cancel orders when necessary due to stock unavailability</li>
          </ul>
          <p>If an ordered product becomes unavailable before dispatch, we will notify you and issue a full refund to the original payment method or provide store credit as per your preference.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">6. Pricing, Currency & Taxes</h2>
          <p>Prices displayed on the website are shown in Indian Rupees (INR / ₹) unless otherwise specified, and are subject to change without prior notice.</p>
          <p>If we discover an obvious pricing or listing error, we reserve the right to correct the error and, where appropriate, cancel the affected order and refund any paid amount.</p>
          <p>Applicable taxes, GST, or duties are applied in accordance with applicable tax regulations. The final payable amount is clearly displayed at checkout before payment confirmation.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">7. Order Acceptance & Cancellation</h2>
          <p>Placing an order through our website constitutes an offer to purchase the selected items. An automated order confirmation email does not constitute final acceptance of the order.</p>
          <p>We reserve the right to accept, reject, limit, or cancel orders due to stock unavailability, suspected fraudulent activity, unauthorized payment attempts, incorrect customer shipping details, or violation of these Terms.</p>
          <p>Because orders enter automated processing and packaging shortly after being placed, orders cannot be canceled once processed or dispatched. If an order cannot be canceled, our All Sales Are Final policy applies.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">8. Payment Terms</h2>
          <p>We accept payment methods displayed during checkout, including UPI, debit/credit cards, net banking, and verified third-party payment gateways (such as Razorpay).</p>
          <p>By submitting payment information, you represent and warrant that you are authorized to use the payment method and that all payment details are accurate.</p>
          <p>LYDIA GLOBAL EXIM does not store full credit card numbers, CVVs, or sensitive banking passwords on its servers. All payment transactions are processed securely through PCI-DSS compliant payment gateways.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">9. Payment Disputes & Chargebacks</h2>
          <p>If you encounter any billing discrepancy, duplicate charge, or payment processing error, please contact LYDIA GLOBAL EXIM customer support immediately so we can investigate and resolve the issue directly.</p>
          <p>You agree not to initiate fraudulent, unauthorized, or false payment disputes or chargebacks for delivered and verified orders. In the event of a dispute, we reserve the right to provide transaction logs, shipment tracking records, unboxing proof guidelines, and communication histories to the payment network or resolution authorities.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">10. All Sales Are Final & Return Policy</h2>
          <p><strong>ALL SALES ARE FINAL.</strong></p>
          <p>Due to hygiene standards and the intricate nature of imitation and fashion jewelry, LYDIA GLOBAL EXIM does not accept returns or exchanges for change of mind, incorrect size/style selection, or personal preference.</p>
          <p>Please review your product selection, sizes, colors, and order summary carefully before completing your purchase.</p>
          <p>For complete details on our policy, please review our <Link to="/returns-policy" className="text-brand-gold underline font-semibold">Return & Refund Policy</Link> and <Link to="/shipping-policy" className="text-brand-gold underline font-semibold">Shipping Policy</Link>.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">11. Transit Damage, Defects & Missing Items (Unboxing Video Requirement)</h2>
          <p>We take complete responsibility for shipping damage, manufacturing defects, and missing items, provided the claim is submitted with mandatory proof:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Mandatory Unboxing Video:</strong> You must record a single, continuous, uncut video showing the sealed parcel from all sides, the opening of the package, and the condition of all items inside.</li>
            <li><strong>7-Day Reporting Window:</strong> All claims must be reported within 7 days of the carrier delivery date via WhatsApp (+91 9014863411) or email (lydiaglobalexim@gmail.com).</li>
          </ul>
          <p><strong>Claim Resolutions:</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Shipping Damage or Manufacturing Defects:</strong> A free replacement item will be dispatched in the next shipment.</li>
            <li><strong>Missing Items:</strong> You may choose between a direct refund for the missing item amount, a store coupon code, or reshipment in the next shipment.</li>
          </ul>
          <p>Claims submitted without a valid uncut unboxing video or reported after 7 days cannot be processed.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">12. Shipping & Delivery</h2>
          <p>Orders are dispatched through reputable courier and logistics partners. Estimated transit times are typically 1–3 business days for processing and 3–7 business days for delivery depending on the destination PIN code / location.</p>
          <p>LYDIA GLOBAL EXIM is not liable for carrier-side transit delays caused by extreme weather, natural events, holidays, regional restrictions, or inaccurate address information provided by the customer.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">13. Accurate Shipping Information</h2>
          <p>Customers are responsible for providing complete and accurate shipping details, including recipient name, complete street address, landmarks, city, state, postal/PIN code, and an active mobile number.</p>
          <p>LYDIA GLOBAL EXIM is not responsible for failed deliveries, returned packages, or extra reshipping charges resulting from incorrect or incomplete customer addresses.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">14. Product Care & Customer Handling</h2>
          <p>Once delivered, customers are responsible for the proper handling, wear, and storage of fashion jewelry. As fashion jewelry is sensitive to water, perfumes, lotions, and harsh chemicals, we recommend reviewing our <Link to="/care-tips" className="text-brand-gold underline font-semibold">Jewelry Care Tips</Link> to maintain the beauty and longevity of your pieces.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">15. Intellectual Property</h2>
          <p>All content on the LYDIA GLOBAL EXIM website—including logos, product photographs, videos, descriptions, brand graphics, artwork, and site design—is the exclusive intellectual property of LYDIA GLOBAL EXIM.</p>
          <p>Unauthorized copying, reproduction, redistribution, or commercial exploitation of our content without express written consent is strictly prohibited.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">16. Prohibited Conduct</h2>
          <p>When using our website, you agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Engage in fraudulent transactions or supply false identity/payment details</li>
            <li>Interfere with or disrupt website security, servers, or networks</li>
            <li>Use automated bots, scrapers, or scripts to harvest website content</li>
            <li>Abuse promotional discounts, coupons, or referral programs</li>
            <li>Violate any applicable local, state, national, or international laws</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">17. Limitation of Liability</h2>
          <p>To the maximum extent permitted by applicable law, LYDIA GLOBAL EXIM and its proprietors, team members, and logistics partners shall not be liable for any indirect, incidental, or consequential damages resulting from website use or product purchases.</p>
          <p>Our total liability for any claim arising from an order shall not exceed the actual amount paid by you for the specific item giving rise to the claim.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">18. Governing Law & Jurisdiction</h2>
          <p>These Terms & Conditions and any disputes arising out of or related to your transactions with LYDIA GLOBAL EXIM shall be governed by and construed in accordance with the laws of India.</p>
          <p>Any legal proceedings or claims shall be subject to the exclusive jurisdiction of the competent courts located in Hyderabad, Telangana, India.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">19. Changes to Terms</h2>
          <p>We may modify or update these Terms from time to time to reflect operational, legal, or regulatory updates. Any changes will be posted on this page with an updated "Last Updated" date.</p>

          <h2 className="text-xl md:text-2xl font-bold text-[#45055B] mt-10 mb-4">20. Contact Us</h2>
          <p>If you have any questions regarding these Terms & Conditions, please contact us:</p>
          <div className="bg-white p-5 rounded-2xl border border-brand-gold/20 space-y-2 text-sm not-prose">
            <p className="font-bold text-[#45055B] text-base">LYDIA GLOBAL EXIM</p>
            <p className="text-gray-700"><strong>Address:</strong> H.No. 3-6-555/7, 1st Floor, Nizampet Road, Kukatpally, Hyderabad - 500072, Telangana, India.</p>
            <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:lydiaglobalexim@gmail.com" className="text-brand-gold underline font-semibold">lydiaglobalexim@gmail.com</a></p>
            <p className="text-gray-700"><strong>WhatsApp / Phone:</strong> <a href="tel:9014863411" className="text-brand-gold underline font-semibold">+91 9014863411</a></p>
            <p className="text-gray-700"><strong>Operating Hours:</strong> Monday – Saturday, 9:00 AM – 6:00 PM IST</p>
          </div>
        </div>
      </div>
    </div>
  );
}

