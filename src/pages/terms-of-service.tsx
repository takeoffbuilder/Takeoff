import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarField } from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfServicePage() {
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
                <FileText className="w-8 h-8 text-white" />
              </div>
              
              <CardTitle className="text-3xl md:text-4xl font-bold text-brand-white">
                Take Off Credit Inc. — Terms and Conditions
              </CardTitle>
              <div className="space-y-1">
                <p className="text-lg text-brand-white/80">Effective Date: October 14, 2025</p>
                <p className="text-lg text-brand-white/80">Last Updated: October 14, 2025</p>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8 space-y-6 text-brand-white/80">
              <section className="space-y-4">
                <p className="text-lg">
                  Welcome to Take Off Credit Inc. ("Take Off Credit," "we," "us," or "our"). These Terms and Conditions ("Terms") govern your use of our website, mobile app, and services (collectively, the "Services"). By creating an account or using the Services, you agree to these Terms and our Privacy Policy.
                </p>
                <p className="text-lg font-semibold text-brand-white">
                  If you do not agree, do not use the Services.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">1. About Take Off Credit</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Take Off Credit Inc. is a financial technology company that provides consumers with tools to help build or improve their credit through credit builder subscription plans ("Booster Plans").</li>
                  <li>Take Off Credit is not a bank, credit bureau, or lender.</li>
                  <li>Banking and reporting services are provided by our third-party financial partners and credit bureaus.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">2. Eligibility</h2>
                <p>To use the Services, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Be at least 18 years of age (or the age of majority in your state);</li>
                  <li>Be a U.S. resident with a valid address;</li>
                  <li>Have a valid Social Security Number or ITIN;</li>
                  <li>Have a U.S.-based checking or savings account; and</li>
                  <li>Provide accurate and verifiable personal information.</li>
                </ul>
                <p className="mt-4">
                  You agree that all information you provide will be truthful and up to date.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">3. Account Registration</h2>
                <p>To access Take Off Credit, you must create an account. You agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information;</li>
                  <li>Keep your credentials secure; and</li>
                  <li>Notify us immediately of unauthorized access.</li>
                </ul>
                <p className="mt-4">
                  You are responsible for any activity under your account.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">4. Credit Builder Plans ("Booster Plans")</h2>
                <p>
                  Take Off Credit offers subscription-based Booster Plans that report your on-time payments to one or more credit bureaus to help build your credit profile.
                </p>
                
                <h3 className="text-xl font-semibold text-brand-white mt-4">4.1 Plan Details</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Each Booster Plan includes a fixed monthly subscription fee and credit builder account limit, as described in the plan you select.</li>
                  <li>Payments are made monthly by debit or credit card, or via ACH authorization.</li>
                </ul>

                <h3 className="text-xl font-semibold text-brand-white mt-4">4.2 Plan Duration</h3>
                <p>
                  Your subscription continues month to month until canceled by you or terminated by Take Off Credit.
                </p>

                <h3 className="text-xl font-semibold text-brand-white mt-4">4.3 Late or Missed Payments</h3>
                <p>
                  Missed or late payments may result in suspension or cancellation of your plan and could negatively impact your credit profile.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">5. Subscription Payment Authorization Agreement</h2>
                <p>By enrolling in a Booster Plan, you authorize Take Off Credit Inc. to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Initiate electronic payments (ACH or debit/credit card) from the payment method you provide;</li>
                  <li>Process recurring payments for your plan fees; and</li>
                  <li>Charge applicable fees, including late payment or add-on service fees.</li>
                </ul>
                
                <p className="mt-4">You understand and agree that:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Payments will be automatically charged on the billing date shown in your dashboard.</li>
                  <li>If a payment fails, Take Off Credit may reattempt the charge or contact you for an alternate payment method.</li>
                  <li>You may cancel auto-pay at any time by disabling it in your account settings or by contacting us at <span className="text-brand-sky-blue">support@takeoffcredit.com</span>.</li>
                </ul>
                
                <p className="mt-4">
                  This authorization remains in effect until your plan is canceled and all outstanding balances are paid.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">6. Credit Reporting Disclosure Notice</h2>
                <p>
                  Take Off Credit may report your account activity to one or more of the major credit bureaus, including TransUnion, and may expand to Equifax and Experian.
                </p>
                
                <p className="mt-4">By using our Services, you acknowledge and agree that:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Take Off Credit will share information about your account, including payment history and plan status, with credit bureaus.</li>
                  <li>Reporting may take up to 30–60 days to appear on your credit report.</li>
                  <li>Results may vary — we do not guarantee a specific credit score increase.</li>
                  <li>Late or missed payments may negatively impact your credit score.</li>
                  <li>You may dispute inaccurate information reported by Take Off Credit directly with the applicable credit bureau or by contacting <span className="text-brand-sky-blue">disputes@takeoffcredit.com</span>.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">7. Fees and Charges</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All plan fees, add-on services, and optional features (such as backdated credit history) are disclosed before purchase.</li>
                  <li>Fees are non-refundable except as required by law.</li>
                  <li>We may update pricing at any time with reasonable notice.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">8. Cancellation</h2>
                <p>You may cancel your Booster Plan at any time:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>In your Dashboard or Settings; or</li>
                  <li>By emailing <span className="text-brand-sky-blue">support@takeoffcredit.com</span>.</li>
                </ul>
                
                <p className="mt-4">After cancellation:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>No further payments will be processed;</li>
                  <li>Credit reporting will stop; and</li>
                  <li>Any remaining balance must be paid in full.</li>
                </ul>
                
                <p className="mt-4">
                  Take Off Credit reserves the right to suspend or cancel your plan for nonpayment, fraud, or misuse.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">9. Affiliate Program</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Users may join our Affiliate Program to earn $10 for each new user who signs up using their unique referral link.</li>
                  <li>Affiliate activity is tracked in your affiliate dashboard.</li>
                  <li>Self-referrals, fraudulent activity, or spam will result in forfeited earnings and account removal.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">10. Privacy and Data Security</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your privacy is important to us. Personal data is handled in accordance with our Privacy Policy.</li>
                  <li>We implement reasonable security measures but cannot guarantee complete protection from unauthorized access or cyberattacks.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">11. Prohibited Conduct</h2>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the Services for illegal, fraudulent, or deceptive purposes;</li>
                  <li>Attempt to gain unauthorized access; or</li>
                  <li>Modify, copy, or reverse-engineer our software.</li>
                </ul>
                <p className="mt-4">
                  Violation may result in immediate termination and potential legal action.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">12. Electronic Communications</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>By using our Services, you consent to receive communications electronically, including agreements, notices, and updates.</li>
                  <li>You may opt out of marketing communications but will continue to receive essential account notifications.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">13. Limitation of Liability</h2>
                <p>
                  To the fullest extent permitted by law, Take Off Credit Inc. and its affiliates shall not be liable for any:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Indirect or consequential damages;</li>
                  <li>Loss of credit score points, data, or income;</li>
                  <li>Delays or failures caused by third parties or technical issues.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">14. Disclaimer of Warranties</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The Services are provided "as is" and "as available."</li>
                  <li>We make no guarantees regarding credit improvement, score outcomes, or uninterrupted availability of the app.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">15. Arbitration and Dispute Resolution</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All disputes arising from these Terms shall be resolved through binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules.</li>
                  <li>By agreeing, you waive the right to a jury trial or class action.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">16. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of the State of Florida, without regard to conflict-of-law provisions.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">17. Changes to These Terms</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We may modify these Terms at any time. Updates will be posted in-app or on our website.</li>
                  <li>Continued use of the Services indicates acceptance of the updated Terms.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-white">18. Contact Information</h2>
                <div className="bg-brand-midnight/50 rounded-lg p-4 border border-brand-sky-blue/20 mt-2">
                  <p><strong className="text-brand-white">Take Off Credit Inc.</strong></p>
                  <p>P.O Box 1000</p>
                  <p><strong className="text-brand-white">Email:</strong> <span className="text-brand-sky-blue">support@takeoffcredit.com</span></p>
                  <p><strong className="text-brand-white">Phone:</strong> [Insert Phone Number]</p>
                  <p><strong className="text-brand-white">Website:</strong> <span className="text-brand-sky-blue">https://www.takeoffcredit.com</span></p>
                </div>
              </section>

              <div className="border-t border-brand-white/20 pt-6 mt-8">
                <p className="text-sm text-brand-white/60">
                  By using Take Off Credit, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
