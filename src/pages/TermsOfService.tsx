import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing or using AutoPenguin's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms constitute a legally binding agreement between you and AutoPenguin.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
              <p className="text-muted-foreground mb-4">
                AutoPenguin provides an AI-powered automation platform that enables users to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Create and manage automated workflows using natural language</li>
                <li>Integrate with various third-party services and APIs</li>
                <li>Monitor and optimize automation performance</li>
                <li>Collaborate with team members on automation projects</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We reserve the right to modify, suspend, or discontinue any aspect of our services at any time with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              <h3 className="text-xl font-medium mb-3 mt-4">3.1 Eligibility</h3>
              <p className="text-muted-foreground mb-4">
                You must be at least 18 years old and capable of forming a binding contract to use our services. By creating an account, you represent and warrant that you meet these requirements.
              </p>
              
              <h3 className="text-xl font-medium mb-3 mt-4">3.2 Account Responsibilities</h3>
              <p className="text-muted-foreground mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
                <li>Providing accurate and current information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use Policy</h2>
              <p className="text-muted-foreground mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use our services to spam, harass, or harm others</li>
                <li>Reverse engineer or attempt to extract our source code</li>
                <li>Resell or redistribute our services without authorization</li>
                <li>Create excessive load on our infrastructure</li>
                <li>Use the service for illegal activities or fraudulent purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Subscription and Payment</h2>
              <h3 className="text-xl font-medium mb-3 mt-4">5.1 Pricing</h3>
              <p className="text-muted-foreground mb-4">
                Our pricing plans are available on our website. We reserve the right to modify pricing with 30 days' notice to existing subscribers.
              </p>
              
              <h3 className="text-xl font-medium mb-3 mt-4">5.2 Billing</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Subscriptions are billed in advance on a monthly or annual basis</li>
                <li>Payment is due at the beginning of each billing cycle</li>
                <li>Failed payments may result in service suspension</li>
                <li>You are responsible for all applicable taxes</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 mt-4">5.3 Refunds</h3>
              <p className="text-muted-foreground mb-4">
                Refunds are provided at our discretion and typically only for service issues on our end. Unused subscription periods are generally non-refundable.
              </p>

              <h3 className="text-xl font-medium mb-3 mt-4">5.4 Cancellation</h3>
              <p className="text-muted-foreground mb-4">
                You may cancel your subscription at any time. Cancellations take effect at the end of the current billing period. No partial refunds will be provided for unused time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <h3 className="text-xl font-medium mb-3 mt-4">6.1 Our IP</h3>
              <p className="text-muted-foreground mb-4">
                AutoPenguin and all related trademarks, logos, and service marks are our property. Our platform, including all software, algorithms, and documentation, is protected by intellectual property laws.
              </p>

              <h3 className="text-xl font-medium mb-3 mt-4">6.2 Your Content</h3>
              <p className="text-muted-foreground mb-4">
                You retain ownership of content you create using our platform. By using our services, you grant us a license to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Store and process your content to provide our services</li>
                <li>Create anonymized aggregated data for analytics</li>
                <li>Display your workflows within the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Data and Privacy</h2>
              <p className="text-muted-foreground mb-4">
                Your use of our services is also governed by our Privacy Policy. We are committed to protecting your data and complying with applicable privacy laws including GDPR and CCPA where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Service Level and Availability</h2>
              <p className="text-muted-foreground mb-4">
                While we strive for 99.9% uptime, we do not guarantee uninterrupted service. We may perform maintenance that temporarily affects service availability. We are not liable for any damages resulting from service interruptions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>AutoPenguin is provided "AS IS" without warranties of any kind</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Our total liability shall not exceed the amount you paid us in the past 12 months</li>
                <li>We are not responsible for third-party services or integrations</li>
                <li>You use our services at your own risk</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
              <p className="text-muted-foreground mb-4">
                You agree to indemnify and hold AutoPenguin harmless from any claims, damages, losses, or expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Your use of our services</li>
                <li>Your violation of these terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Your content or workflows</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
              <p className="text-muted-foreground mb-4">
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Violate these Terms of Service</li>
                <li>Engage in fraudulent activity</li>
                <li>Fail to pay subscription fees</li>
                <li>Pose a security risk to our platform</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Upon termination, your access will cease immediately. We may retain certain data as required by law or for legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Dispute Resolution</h2>
              <h3 className="text-xl font-medium mb-3 mt-4">12.1 Governing Law</h3>
              <p className="text-muted-foreground mb-4">
                These terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-medium mb-3 mt-4">12.2 Arbitration</h3>
              <p className="text-muted-foreground mb-4">
                Any disputes will be resolved through binding arbitration rather than in court, except for small claims court matters or intellectual property disputes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We may modify these terms at any time. Material changes will be notified via email or platform notification. Continued use after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                For questions about these Terms of Service, contact us:
              </p>
              <ul className="list-none space-y-2 text-muted-foreground">
                <li><strong>Email:</strong> info@autopenguin.app</li>
                <li><strong>Customer Support:</strong> cs@autopenguin.app</li>
                <li><strong>Sales:</strong> sales@autopenguin.app</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}