import React from "react";
import { ShieldCheck, Lock, Eye, FileText, Bell, Globe2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PrivacyPolicy() {
  const lastUpdated = "August 14, 2026";

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Privacy & Transparency
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          Last updated: {lastUpdated}. Your privacy is fundamentally important to us at Prachurjo.
        </p>
      </div>

      <Card className="border-border space-y-6 p-2 md:p-4">
        <CardContent className="space-y-6 pt-6 text-sm text-muted-foreground leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary shrink-0" />
              1. Client-Side Data Processing & Security
            </h2>
            <p>
              At <strong className="text-foreground">Prachurjo</strong> (accessible from <a href="https://www.prachurjo.online" className="text-primary hover:underline">https://www.prachurjo.online</a>), one of our main priorities is the privacy of our visitors.
            </p>
            <p>
              All core tool operations—including image format conversion (PNG, JPG, WebP), favicon rendering, text case modifications, and YouTube thumbnail previews—are executed <strong className="text-foreground font-semibold">entirely inside your local web browser</strong>. Your files, uploaded assets, and text strings are never transmitted to, uploaded onto, or stored on any external server.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary shrink-0" />
              2. Information We Do Not Collect
            </h2>
            <p>
              We do not require user accounts, email registration, or personal identification details to use any of our web utility tools. We do not store, catalog, or harvest your personal files, transformed images, or generated text snippets.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-primary shrink-0" />
              3. Google AdSense & Third-Party Cookies
            </h2>
            <p>
              Prachurjo may display third-party advertisements served by <strong className="text-foreground">Google AdSense</strong>. 
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites.</li>
              <li>Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to our sites and/or other sites on the Internet.</li>
              <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google Ads Settings</a> or <a href="https://www.aboutads.info" target="_blank" rel="noreferrer" className="text-primary hover:underline">aboutads.info</a>.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              4. Log Files & Analytics
            </h2>
            <p>
              Prachurjo follows a standard procedure of using log files provided automatically by our cloud hosting infrastructure (such as Vercel). These logs may record internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamps, and referring/exit pages. This information is purely used for monitoring infrastructure performance, diagnosing server errors, and preventing malicious activity.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary shrink-0" />
              5. Rights under GDPR & CCPA
            </h2>
            <p>
              Under global data privacy laws like GDPR and CCPA, users have rights regarding personal data. Since Prachurjo does not collect or store personal user data, profiles, or uploaded content, your personal identity remains naturally anonymous while using our platform.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2 pt-2 border-t">
            <h2 className="text-lg font-bold text-foreground">6. Contact Us About Privacy</h2>
            <p>
              If you have additional questions or require more information about our Privacy Policy, please contact us via email at <a href="mailto:naxivocreators@gmail.com" className="text-primary hover:underline font-medium">naxivocreators@gmail.com</a> or through our <a href="/contact-us" className="text-primary hover:underline font-medium">Contact Page</a>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
