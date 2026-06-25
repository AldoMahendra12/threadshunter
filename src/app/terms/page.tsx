import React from 'react'
import { ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Threads Hunter',
  description: 'Read the terms of service governing the use of the Threads Hunter automation platform.',
}

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-gray-400 mb-8">Last Updated: June 24, 2026</p>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">1. Agreement to Terms</h2>
              <p>
                By accessing or using the website and software application known as Threads Hunter (the &quot;Service&quot;), 
                you agree to be bound by these Terms of Service (&quot;Terms&quot;). These Terms constitute a legally binding agreement 
                between you and Threads Hunter. 
              </p>
              <p>
                If you do not agree with any of these Terms, you are prohibited from using or accessing our Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">2. Description of Service</h2>
              <p>
                Threads Hunter provides an AI-powered outreach and marketing automation platform for Instagram and Threads. 
                Our Service integrates with the Meta API to monitor designated posts, trigger automated responses (comments or direct messages) 
                to users who interact with your posts, and capture leads via custom destination pages.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">3. Eligibility and Accounts</h2>
              <p>
                To use our Service, you must register for an account and connect your Meta account (Facebook Login). 
                You agree to supply accurate registration info and keep your credentials secure. You are entirely responsible 
                for all activities occurring under your account or linked social media channels.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">4. Subscription Billing, Upgrades, and Cancellations</h2>
              <p>
                Certain features of the Service require a paid subscription. Billing is managed via our Merchant of Record, Paddle.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-white">Pricing Plans:</strong> We offer Starter, Pro, and Scale plans, subject to the price list visible on our pricing page.
                </li>
                <li>
                  <strong className="text-white">Auto-Renewal:</strong> Subscriptions renew automatically at the end of each billing cycle (monthly or annually) unless cancelled.
                </li>
                <li>
                  <strong className="text-white">Cancellations:</strong> You can cancel your subscription at any time via the settings panel in your dashboard. You will continue to have access to the service through the end of your current billing period.
                </li>
                <li>
                  <strong className="text-white">Refunds:</strong> Refunds are handled in accordance with our billing partner&apos;s guidelines and are generally processed if requested within 14 days of purchase, subject to reasonable usage limits.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">5. Meta API & Platform Integrity</h2>
              <p>
                Our Service depends on APIs provided by Meta Platforms (Facebook, Instagram, Threads). 
                By using Threads Hunter, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Comply with Meta&apos;s Terms of Service, Instagram Community Guidelines, and Developer Policies.</li>
                <li>Avoid using the Service to distribute spam, coordinate harassment, send unsolicited promotional messages, or violate anti-spam regulations (such as CAN-SPAM or GDPR).</li>
                <li>Acknowledge that Meta may restrict, suspend, or modify their API access rules at any time, which may temporarily or permanently impact our Service features. Threads Hunter is not liable for service degradation caused by Meta platform updates.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">6. Prohibited Conduct</h2>
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any local, state, national, or international laws.</li>
                <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation.</li>
                <li>Interfere with or disrupt the Service servers or networks.</li>
                <li>Attempt to reverse engineer, decompile, or extract source code from the software.</li>
                <li>Utilize automated scripts to scrape or harvest content from the platform without authorization.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">7. Intellectual Property</h2>
              <p>
                Threads Hunter and its original logo, features, designs, and source code are the exclusive property of Threads Hunter. 
                Our trademarks, brand elements, and UI elements may not be used in connection with any third-party product or service 
                without our prior written consent.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">8. Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
                THREADS HUNTER DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS 
                FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, 
                OR SECURE.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">9. Limitation of Liability</h2>
              <p>
                IN NO EVENT SHALL THREADS HUNTER, ITS DIRECTORS, EMPLOYEES, OR PARTNERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER 
                INTANGIBLE LOSSES, RESULTING FROM (I) YOUR ACCESS TO OR USE OF THE SERVICE; (II) ANY CONDUCT OR CONTENT OF ANY THIRD 
                PARTY ON THE SERVICE; OR (III) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">10. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Threads Hunter operates, 
                without regard to conflict of law provisions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">11. Changes to Terms</h2>
              <p>
                We reserve the right to revise or replace these Terms at any time. If a revision is material, we will provide notice 
                prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, 
                you agree to be bound by the updated Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white">12. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-white font-medium">support@threadshunter-opal.vercel.app</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
