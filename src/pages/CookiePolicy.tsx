import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
              <p className="text-muted-foreground mb-4">
                Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, analyzing how you use our services, and improving our platform's functionality.
              </p>
              <p className="text-muted-foreground mb-4">
                Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device until deleted or they expire. Session cookies are temporary and are deleted when you close your browser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
              <p className="text-muted-foreground mb-4">
                AutoPenguin uses cookies for several purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Essential Operations:</strong> Enable core functionality like authentication and security</li>
                <li><strong>Performance:</strong> Analyze how visitors use our platform to improve performance</li>
                <li><strong>Functionality:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics:</strong> Understand user behavior and optimize our services</li>
                <li><strong>Marketing:</strong> Deliver relevant content and measure campaign effectiveness</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-medium mb-3 mt-4">3.1 Strictly Necessary Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies are essential for our website to function properly. They enable core features such as:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>User authentication and account access</li>
                <li>Security and fraud prevention</li>
                <li>Load balancing</li>
                <li>Network routing</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Duration:</strong> Session and persistent cookies<br />
                <strong>Can be disabled:</strong> No (these are required for the platform to work)
              </p>

              <h3 className="text-xl font-medium mb-3 mt-6">3.2 Performance and Analytics Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies help us understand how visitors interact with our platform:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Page views and navigation patterns</li>
                <li>Error messages and loading times</li>
                <li>Feature usage statistics</li>
                <li>Traffic sources and referrals</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Third-party services:</strong> Google Analytics, Mixpanel<br />
                <strong>Duration:</strong> Up to 2 years<br />
                <strong>Can be disabled:</strong> Yes
              </p>

              <h3 className="text-xl font-medium mb-3 mt-6">3.3 Functional Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies remember your preferences and personalize your experience:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Language preferences</li>
                <li>Theme settings (light/dark mode)</li>
                <li>Dashboard configurations</li>
                <li>Recent workflows and projects</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Duration:</strong> Up to 1 year<br />
                <strong>Can be disabled:</strong> Yes (but may affect functionality)
              </p>

              <h3 className="text-xl font-medium mb-3 mt-6">3.4 Marketing and Advertising Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies are used to deliver relevant advertising and measure campaign effectiveness:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Track ad impressions and clicks</li>
                <li>Measure conversion rates</li>
                <li>Retargeting campaigns</li>
                <li>Social media integration</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Third-party services:</strong> Facebook Pixel, Google Ads, LinkedIn Insights<br />
                <strong>Duration:</strong> Up to 2 years<br />
                <strong>Can be disabled:</strong> Yes
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
              <p className="text-muted-foreground mb-4">
                We use services from trusted third-party providers who may set their own cookies:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Google Analytics:</strong> Website analytics and performance tracking</li>
                <li><strong>Facebook:</strong> Social media integration and advertising</li>
                <li><strong>LinkedIn:</strong> Professional networking and B2B marketing</li>
                <li><strong>Stripe:</strong> Payment processing (secure transactions)</li>
                <li><strong>Intercom:</strong> Customer support and messaging</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                These third parties have their own privacy policies and cookie practices. We encourage you to review their policies for more information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cookie Details</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-border mt-4">
                  <thead className="bg-muted">
                    <tr>
                      <th className="border border-border px-4 py-2 text-left">Cookie Name</th>
                      <th className="border border-border px-4 py-2 text-left">Purpose</th>
                      <th className="border border-border px-4 py-2 text-left">Type</th>
                      <th className="border border-border px-4 py-2 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr>
                      <td className="border border-border px-4 py-2">session_id</td>
                      <td className="border border-border px-4 py-2">User authentication</td>
                      <td className="border border-border px-4 py-2">Essential</td>
                      <td className="border border-border px-4 py-2">Session</td>
                    </tr>
                    <tr>
                      <td className="border border-border px-4 py-2">user_preferences</td>
                      <td className="border border-border px-4 py-2">Store settings</td>
                      <td className="border border-border px-4 py-2">Functional</td>
                      <td className="border border-border px-4 py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="border border-border px-4 py-2">_ga</td>
                      <td className="border border-border px-4 py-2">Google Analytics</td>
                      <td className="border border-border px-4 py-2">Analytics</td>
                      <td className="border border-border px-4 py-2">2 years</td>
                    </tr>
                    <tr>
                      <td className="border border-border px-4 py-2">_fbp</td>
                      <td className="border border-border px-4 py-2">Facebook Pixel</td>
                      <td className="border border-border px-4 py-2">Marketing</td>
                      <td className="border border-border px-4 py-2">3 months</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. How to Manage Cookies</h2>
              <p className="text-muted-foreground mb-4">
                You have several options to manage or disable cookies:
              </p>
              
              <h3 className="text-xl font-medium mb-3 mt-4">6.1 Browser Settings</h3>
              <p className="text-muted-foreground mb-4">
                Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>View and delete existing cookies</li>
                <li>Block third-party cookies</li>
                <li>Block all cookies</li>
                <li>Delete cookies when closing the browser</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Instructions for popular browsers:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 mt-6">6.2 Cookie Consent Tool</h3>
              <p className="text-muted-foreground mb-4">
                When you first visit our website, you can choose which types of cookies to accept through our cookie consent banner. You can change your preferences at any time by accessing the cookie settings in the footer.
              </p>

              <h3 className="text-xl font-medium mb-3 mt-6">6.3 Opt-Out Links</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Browser Add-on</a></li>
                <li><strong>Facebook:</strong> <a href="https://www.facebook.com/settings?tab=ads" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Ad Preferences</a></li>
                <li><strong>Do Not Track:</strong> Enable in your browser settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Impact of Disabling Cookies</h2>
              <p className="text-muted-foreground mb-4">
                Disabling cookies may affect your experience on our platform:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>You may need to log in repeatedly</li>
                <li>Your preferences won't be saved</li>
                <li>Some features may not work properly</li>
                <li>Personalization will be limited</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Essential cookies cannot be disabled as they are necessary for the platform to function.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Updates to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this Cookie Policy to reflect changes in our practices or for legal and regulatory reasons. We will notify you of significant changes by updating the "Last updated" date and, where appropriate, through email or platform notifications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about our use of cookies, please contact us:
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