import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Welcome to AutoPenguin ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered automation platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-medium mb-3 mt-4">2.1 Information You Provide</h3>
              <p className="text-muted-foreground mb-4">
                We collect information that you voluntarily provide when using our services:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Account information (name, email address, company name)</li>
                <li>Profile information and preferences</li>
                <li>Workflow data and automation configurations</li>
                <li>Communication data (support requests, feedback)</li>
                <li>Payment information (processed securely through third-party providers)</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <p className="text-muted-foreground mb-4">
                We automatically collect certain information when you use our platform:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (features used, pages visited, time spent)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Log data and error reports</li>
                <li>Facebook Pixel tracking data (when marketing cookies are enabled) including page views, button clicks, and conversion events</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Facebook Pixel:</strong> With your consent (via marketing cookies), we use Meta's Facebook Pixel to track website interactions and measure the effectiveness of our advertising campaigns. This data is shared with Facebook/Meta and may be used for targeted advertising. You can opt-out of this tracking by rejecting marketing cookies in our cookie consent banner or by adjusting your preferences in our <a href="/cookie-policy" className="underline hover:text-foreground">Cookie Policy</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your automation workflows and API requests</li>
                <li>Communicate with you about updates, security alerts, and support</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Prevent fraud, abuse, and security incidents</li>
                <li>Comply with legal obligations</li>
                <li>Send marketing communications (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell your personal information. We may share your data in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Service Providers:</strong> Third-party vendors who assist in providing our services (hosting, analytics, payment processing)</li>
                <li><strong>Advertising Partners:</strong> Meta/Facebook receives tracking data through Facebook Pixel when you consent to marketing cookies. This data may be used for targeted advertising, analytics, and measurement purposes.</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                For detailed information about how we use cookies and tracking technologies, including Facebook Pixel, please review our <a href="/cookie-policy" className="underline hover:text-foreground">Cookie Policy</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure data centers with physical security measures</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Privacy Rights</h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, please contact us at info@autopenguin.app
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain your information for as long as necessary to provide our services and comply with legal obligations. When you delete your account, we will delete or anonymize your personal data within 90 days, except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
              <p className="text-muted-foreground mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground mb-4">
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-none space-y-2 text-muted-foreground">
                <li><strong>Email:</strong> info@autopenguin.app</li>
                <li><strong>Support:</strong> cs@autopenguin.app</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}