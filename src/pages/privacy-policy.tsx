import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarField } from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
      <StarField />
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-sky-blue/20 via-transparent to-transparent opacity-60" />
      
      <div className="relative z-10 min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 text-brand-white hover:text-brand-sky-blue hover:bg-brand-sky-blue/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="border-brand-sky-blue/30 bg-brand-charcoal/80 backdrop-blur-xl shadow-2xl shadow-brand-sky-blue/20">
            <CardHeader className="text-center space-y-4 pt-8 pb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light flex items-center justify-center shadow-xl shadow-brand-sky-blue/40">
                <Lock className="w-8 h-8 text-white" />
              </div>
              
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand-white">
                Take Off Credit Inc. – Privacy Policy
              </CardTitle>
              <div className="space-y-1">
                <p className="text-lg text-brand-white/80">Effective Date: October 14, 2025</p>
                <p className="text-lg text-brand-white/80">Last Updated: October 14, 2025</p>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8 space-y-6 text-brand-white/80">
              <section className="space-y-4">
                <p className="text-lg">
                  At Take Off Credit Inc. ("Take Off Credit," "we," "us," or "our"), your privacy is our priority. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our website, mobile app, and related services (collectively, the "Services").
                </p>
                <p className="text-lg">
                  By accessing or using the Services, you consent to the practices described in this Privacy Policy.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">1. Information We Collect</h2>
                <p>
                  We collect personal, financial, and technical information to operate and improve our Services, verify identity, and provide credit builder features.
                </p>

                <h3 className="text-xl font-semibold text-brand-white mt-4">1.1 Information You Provide</h3>
                <p>When you create an account, sign up for a Booster Plan, or contact us, we collect:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Residential address</li>
                  <li>Social Security Number or ITIN (for identity verification only)</li>
                  <li>Date of birth</li>
                  <li>Payment information (e.g., debit/credit card, bank account for ACH)</li>
                  <li>Employment or income information (if applicable)</li>
                </ul>

                <h3 className="text-xl font-semibold text-brand-white mt-4">1.2 Information We Collect Automatically</h3>
                <p>When you access our app or website, we automatically collect:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Device and browser information</li>
                  <li>IP address and geolocation data</li>
                  <li>Usage and interaction data (pages visited, actions taken)</li>
                  <li>Cookies, session identifiers, and app analytics</li>
                </ul>

                <h3 className="text-xl font-semibold text-brand-white mt-4">1.3 Information from Third Parties</h3>
                <p>We may also collect or verify information from:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Credit bureaus (e.g., TransUnion)</li>
                  <li>Banking partners or payment processors</li>
                  <li>Identity verification services</li>
                  <li>Referral or affiliate partners</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">2. How We Use Your Information</h2>
                <p>We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and manage your Take Off Credit account and Booster Plans;</li>
                  <li>Verify your identity and prevent fraud;</li>
                  <li>Report your payment activity to participating credit bureaus;</li>
                  <li>Communicate with you about your account, payments, and updates;</li>
                  <li>Improve the functionality and security of our app;</li>
                  <li>Comply with legal and regulatory obligations; and</li>
                  <li>Offer rewards, affiliate earnings, or promotions where applicable.</li>
                </ul>
                <p className="mt-4 font-semibold text-brand-white">
                  We never sell your personal information to third parties.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">3. Credit Reporting Information</h2>
                <p>
                  If you enroll in a Booster Plan, Take Off Credit may share your account activity with one or more credit bureaus (currently TransUnion, and potentially others).
                </p>
                <p className="mt-4">We report:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>On-time and late payments</li>
                  <li>Account balance or limit</li>
                  <li>Account start and end dates</li>
                  <li>Plan status (active, cancelled, closed)</li>
                </ul>
                <p className="mt-4">
                  Credit reporting helps you build history, but Take Off Credit cannot guarantee a specific credit score outcome.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">4. Payment Information</h2>
                <p>When you make payments through Take Off Credit:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your debit/credit card or bank information is processed securely by our payment processors.</li>
                  <li>Take Off Credit does not store full payment details.</li>
                  <li>We maintain transaction identifiers for audit and recordkeeping purposes.</li>
                  <li>All payment transmissions are encrypted using SSL/TLS security standards.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">5. Cookies and Tracking Technologies</h2>
                <p>We use cookies, tracking pixels, and analytics tools to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Maintain session integrity and account access;</li>
                  <li>Improve app performance; and</li>
                  <li>Measure engagement and marketing effectiveness.</li>
                </ul>
                <p className="mt-4">
                  You can disable cookies in your browser settings, but some features may not function properly.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">6. Sharing of Information</h2>
                <p>We may share your information with:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Credit bureaus (for reporting activity);</li>
                  <li>Payment processors (for handling transactions);</li>
                  <li>Service providers (IT, cloud hosting, analytics, and support tools);</li>
                  <li>Regulatory or law enforcement authorities (as required by law); and</li>
                  <li>Affiliate partners (to credit signups or referral earnings).</li>
                </ul>
                <p className="mt-4">
                  Each partner is contractually obligated to protect your data and use it only for legitimate business purposes.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">7. Affiliate Tracking Disclosure</h2>
                <p>
                  Take Off Credit's Affiliate Program allows users to earn commissions for qualified referrals.
                  When you share your affiliate link:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We track referrals via cookies or link identifiers;</li>
                  <li>We record signups associated with your link;</li>
                  <li>No financial or credit information is shared with affiliates.</li>
                </ul>
                <p className="mt-4">
                  All affiliate earnings are paid according to the Affiliate Terms & Conditions and applicable tax laws.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">8. Data Retention</h2>
                <p>We retain personal data only as long as necessary to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and maintain your account;</li>
                  <li>Meet legal and reporting requirements; or</li>
                  <li>Resolve disputes and enforce agreements.</li>
                </ul>
                <p className="mt-4">
                  When no longer required, data is securely deleted or anonymized.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">9. Security Practices</h2>
                <p>We use administrative, technical, and physical safeguards to protect your information, including:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encryption of sensitive data;</li>
                  <li>Secure data centers and firewalls;</li>
                  <li>Access controls for employees and systems;</li>
                  <li>Ongoing monitoring for unauthorized access or misuse.</li>
                </ul>
                <p className="mt-4">
                  While we take strong precautions, no system is 100% secure. You are responsible for maintaining the confidentiality of your login credentials.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">10. Your Privacy Rights</h2>
                <p>
                  Depending on your state of residence (e.g., California, Virginia, Colorado), you may have rights to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access a copy of your personal information;</li>
                  <li>Request correction or deletion;</li>
                  <li>Opt out of certain data sharing;</li>
                  <li>Lodge a complaint regarding misuse of your information.</li>
                </ul>
                <p className="mt-4">
                  To exercise your rights, contact <a href="mailto:privacy@takeoffcredit.com" className="text-brand-sky-blue hover:underline">privacy@takeoffcredit.com</a> or mail a written request to our business address.
                </p>
                <p className="mt-2">
                  We will respond to all verified requests within legally required timeframes.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">11. Children's Privacy</h2>
                <p>
                  Take Off Credit does not knowingly collect information from anyone under 18 years of age.
                  If we discover a minor has submitted personal data, it will be promptly deleted.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">12. Third-Party Links</h2>
                <p>
                  Our Services may contain links to third-party websites or tools. Take Off Credit is not responsible for their privacy practices or content.
                  We encourage users to review the privacy policies of all third-party sites they visit.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">13. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy periodically.
                  Any changes will be posted in-app or on our website, with the updated effective date.
                  Continued use of the Services after changes means you accept the revised Policy.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">14. Contact Us</h2>
                <p>For privacy or data protection inquiries, contact:</p>
                <div className="bg-brand-midnight/50 rounded-lg p-4 border border-brand-sky-blue/20 mt-2">
                  <p><strong className="text-brand-white">Take Off Credit Inc.</strong></p>
                  <p>[Insert Business Address]</p>
                  <p><strong className="text-brand-white">Email:</strong> <a href="mailto:privacy@takeoffcredit.com" className="text-brand-sky-blue hover:underline">privacy@takeoffcredit.com</a></p>
                  <p><strong className="text-brand-white">Website:</strong> <a href="https://www.takeoffcredit.com" className="text-brand-sky-blue hover:underline" target="_blank" rel="noopener noreferrer">https://www.takeoffcredit.com</a></p>
                </div>
              </section>

              <div className="border-t border-brand-white/20 pt-6 mt-8">
                <p className="text-sm text-brand-white/60">
                  By using Take Off Credit, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
