import React from 'react'
import { ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Threads Hunter',
  description: 'Learn how Threads Hunter collects, uses, and protects your personal and Meta API data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-300 font-sans relative overflow-hidden py-20 px-6">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-1/3 w-[600px] h-[600px] bg-[#7C3AED] opacity-[0.05] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <Link href="/" className="inline-flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Zap className="text-[#7C3AED] w-6 h-6" />
            <span className="text-xl font-bold tracking-tight text-white">
              Threads<span className="text-[#7C3AED]">Hunter</span>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-[#1A1D27] border border-[#2D3148] rounded-2xl p-8 md:p-12 shadow-xl">
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-400 mb-8">Last Updated: June 24, 2026</p>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">1. Introduction</h2>
              <p>
                Welcome to Threads Hunter. We respect your privacy and are committed to protecting your personal data. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform 
                (including our website, API integrations, and outreach tools).
              </p>
              <p>
                By using Threads Hunter, you agree to the collection and use of information in accordance with this policy. 
                If you do not agree with any terms in this Privacy Policy, please discontinue your use of our services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">2. Information We Collect</h2>
              <p>We collect information that you provide directly to us, as well as data automatically generated during your use of our platform:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-white">Account Information:</strong> When you register an account, we collect credentials such as your email address and authentication details.
                </li>
                <li>
                  <strong className="text-white">Meta API & Instagram Data:</strong> To enable automated outreach on Threads and Instagram, we request permissions via Meta OAuth (Facebook login). We store OAuth access tokens, profile IDs, and relevant message/comment metadata to perform interactions on your behalf.
                </li>
                <li>
                  <strong className="text-white">Billing Information:</strong> Payments are processed via Paddle. We do not store raw credit card details on our servers; however, we retain subscription IDs, customer IDs, and status logs to manage your access to our plans.
                </li>
                <li>
                  <strong className="text-white">Usage & System Data:</strong> We collect log files, IP addresses, browser types, and usage metrics to monitor performance and improve our features.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">3. How We Use Your Information</h2>
              <p>We use the collected data for various purposes, including to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, operate, and maintain our subscription-based outreach services.</li>
                <li>Verify your account credentials and authorize Meta API requests.</li>
                <li>Automate outbound DMs/comments based on user interactions on your Threads posts.</li>
                <li>Process payments, manage renewals, and handle billing inquiries.</li>
                <li>Improve user experience, identify system issues, and optimize AI models.</li>
                <li>Send transactional notifications, security alerts, and customer support responses.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">4. Data Sharing & Third Parties</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We share data only with trusted service partners 
                strictly necessary to provide our service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-white">Meta Platforms (Facebook/Instagram/Threads):</strong> To interact with your social profiles and deliver outreach messages under your explicit authorization.
                </li>
                <li>
                  <strong className="text-white">Paddle:</strong> As our Merchant of Record and payment gateway provider for processing all subscription transactions.
                </li>
                <li>
                  <strong className="text-white">Supabase:</strong> For secure database hosting and user authentication management.
                </li>
                <li>
                  <strong className="text-white">AI Services (OpenRouter/OpenAI/Anthropic):</strong> To generate optimized response copy based strictly on contextual interaction data.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">5. Data Retention & Deletion</h2>
              <p>
                We retain your personal and API-related data only as long as necessary to fulfill the purposes outlined in this policy or 
                to comply with legal requirements. 
              </p>
              <p>
                You may request deletion of your account and revoke all Meta API permissions at any time through your dashboard settings. 
                Upon deletion, all database records including linked Instagram/Threads credentials will be permanently erased from our active databases.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">6. Security of Your Data</h2>
              <p>
                We use industry-standard encryption protocols to protect your Meta access tokens and personal identifiers. 
                While we strive to use commercially acceptable means to protect your personal data, no method of transmission over the Internet 
                or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">7. Your Rights Under GDPR/CCPA</h2>
              <p>
                Depending on your location, you may have specific rights regarding your personal data, including the right to access, 
                correct, update, or request the deletion of your personal information. To exercise any of these rights, please contact us.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">8. Changes to This Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
                on this page and updating the &quot;Last Updated&quot; date at the top of this policy. You are advised to review this policy periodically.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">9. Contact Us</h2>
              <p>
                If you have any questions or suggestions about our Privacy Policy, do not hesitate to reach out to us at:
              </p>
              <p className="text-white font-medium">support@threadshunter-opal.vercel.app</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
