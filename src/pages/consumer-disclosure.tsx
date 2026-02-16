import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarField } from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { ArrowLeft, Shield } from "lucide-react";

export default function ConsumerDisclosurePage() {
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
                <Shield className="w-8 h-8 text-white" />
              </div>
              
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand-white">
                Take Off Credit Inc. – Consumer Disclosure & Communication Agreement
              </CardTitle>
              <div className="space-y-1">
                <p className="text-lg text-brand-white/80">Effective Date: October 14, 2025</p>
                <p className="text-lg text-brand-white/80">Last Updated: October 14, 2025</p>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8 space-y-6 text-brand-white/80">
              <section className="space-y-4">
                <p className="text-lg">
                  This <strong className="text-brand-white">Consumer Disclosure & Communication Agreement</strong> ("Agreement") explains how <strong className="text-brand-white">Take Off Credit Inc.</strong> ("Take Off Credit," "we," "our," or "us") provides important information to you electronically and how we communicate with you as part of your use of our services.
                </p>
                <p className="text-lg">
                  By creating an account, enrolling in a Booster Plan, or otherwise using our services, you acknowledge that you have read, understood, and agree to this Agreement.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">1. Scope of Communications</h2>
                <p>
                  This Agreement applies to all communications, disclosures, agreements, notices, statements, and other documents (collectively, "Communications") that Take Off Credit provides in connection with your use of our website, mobile application, and services (collectively, the "Services").
                </p>
                <p className="mt-4">These Communications include, but are not limited to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Terms and Conditions, Privacy Policy, and updates</li>
                  <li>Account statements, payment summaries, and receipts</li>
                  <li>Credit reporting updates and notices</li>
                  <li>Legal and regulatory disclosures</li>
                  <li>Affiliate program information</li>
                  <li>Customer service communications</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">2. Method of Delivery</h2>
                <p>We will deliver all Communications to you electronically by:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email (to the address you provide during account registration or updates);</li>
                  <li>In-app messages or notifications; or</li>
                  <li>Through our website or secure account dashboard.</li>
                </ul>
                <p className="mt-4">
                  You agree that all electronic Communications from Take Off Credit satisfy any legal requirement that such Communications be in writing.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">3. Maintaining Accurate Contact Information</h2>
                <p>
                  You are responsible for keeping your contact information up to date.
                  This includes maintaining an active and accessible:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email address, and</li>
                  <li>Mobile phone number (if SMS notifications are enabled).</li>
                </ul>
                <p className="mt-4">
                  If your contact information changes, update it through your <strong className="text-brand-white">account settings</strong> or by emailing <a href="mailto:support@takeoffcredit.com" className="text-brand-sky-blue hover:underline">support@takeoffcredit.com</a>.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">4. Paper Copies</h2>
                <p>
                  You may request a paper copy of any legally required disclosure or Communication at no additional cost by contacting us at <a href="mailto:support@takeoffcredit.com" className="text-brand-sky-blue hover:underline">support@takeoffcredit.com</a>.
                  Please include your full name, mailing address, and the specific document you are requesting.
                </p>
                <p className="mt-4">
                  We may charge a reasonable fee for excessive or repeated requests, as permitted by law.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">5. Withdrawing Consent</h2>
                <p>
                  You may withdraw your consent to receive electronic Communications at any time by contacting us at <a href="mailto:support@takeoffcredit.com" className="text-brand-sky-blue hover:underline">support@takeoffcredit.com</a>.
                  If you withdraw consent:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We may close or suspend your account, since most Communications are provided electronically;</li>
                  <li>You will remain responsible for any outstanding obligations under your Booster Plan(s).</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">6. Technical Requirements</h2>
                <p>To receive and retain electronic Communications, you must have:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>A device capable of accessing the internet;</li>
                  <li>A current web browser (e.g., Chrome, Safari, or Edge);</li>
                  <li>A valid email account; and</li>
                  <li>Software capable of viewing PDF documents.</li>
                </ul>
                <p className="mt-4">
                  It is your responsibility to ensure these requirements are met and maintained.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">7. System Downtime and Notifications</h2>
                <p>
                  While we strive for uninterrupted service, Take Off Credit is not responsible for delays or failures in electronic delivery due to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Internet service interruptions,</li>
                  <li>Device malfunctions, or</li>
                  <li>Email filtering or spam blocking.</li>
                </ul>
                <p className="mt-4">
                  If you believe you did not receive a required Communication, please contact <a href="mailto:support@takeoffcredit.com" className="text-brand-sky-blue hover:underline">support@takeoffcredit.com</a> immediately.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">8. Acknowledgment and Consent</h2>
                <p>
                  By creating an account, using our app, or continuing to use the Services, you acknowledge that you:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Have read and understood this Consumer Disclosure & Communication Agreement;</li>
                  <li>Consent to receive all Communications electronically; and</li>
                  <li>Understand that your continued use of Take Off Credit constitutes acceptance of this Agreement.</li>
                </ul>
                <p className="mt-4">
                  No physical or electronic signature is required for this consent to be valid.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">9. Contact Information</h2>
                <div className="bg-brand-midnight/50 rounded-lg p-4 border border-brand-sky-blue/20 mt-2">
                  <p><strong className="text-brand-white">Take Off Credit Inc.</strong></p>
                  <p>[Insert Business Address]</p>
                  <p><strong className="text-brand-white">Email:</strong> <a href="mailto:support@takeoffcredit.com" className="text-brand-sky-blue hover:underline">support@takeoffcredit.com</a></p>
                  <p><strong className="text-brand-white">Phone:</strong> [Insert Phone Number]</p>
                  <p><strong className="text-brand-white">Website:</strong> <a href="https://www.takeoffcredit.com" className="text-brand-sky-blue hover:underline" target="_blank" rel="noopener noreferrer">https://www.takeoffcredit.com</a></p>
                </div>
              </section>

              <div className="border-t border-brand-white/20 pt-6 mt-8">
                <p className="text-sm text-brand-white/60">
                  By using Take Off Credit, you acknowledge that you have read, understood, and agree to be bound by this Consumer Disclosure & Communication Agreement.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
