import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for the Amrio Portal.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0e0e0e] px-4 py-12 text-neutral-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur md:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">
          Amrio Portal
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm leading-7 text-neutral-300">
          Privacy Statement (GDPR)
        </p>
        <p className="mt-2 text-sm leading-7 text-neutral-400">
          Last updated: 24 June 2025
        </p>
        <p className="mt-4 text-sm leading-7 text-neutral-300">
          Amrio (hereinafter: &quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
          places great importance on protecting your personal data. This
          comprehensive privacy statement explains what data we collect, why we
          collect it, how we process it, and what rights you have.
        </p>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 1. Definitions
          </h2>
          <p>
            Personal Data: any information relating to an identified or
            identifiable natural person.
          </p>
          <p>
            Processing: any operation or set of operations performed on personal
            data.
          </p>
          <p>
            Data Controller: the party that determines the purposes and means of
            processing (us).
          </p>
          <p>
            Processor: a party that processes personal data on behalf of the
            Data Controller (for example Stripe, Supabase, PostHog, Microsoft).
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 2. Contact Details of the Data Controller
          </h2>
          <p>Name: Amrio</p>
          <p>
            E-mail:{" "}
            <a
              href="mailto:info@amrio.nl"
              className="underline underline-offset-4"
            >
              info@amrio.nl
            </a>
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 3. Purposes and Legal Bases
          </h2>
          <p>
            Below is an overview of the purposes for which we process personal
            data, the categories of data involved, and the applicable legal
            bases.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-neutral-200">
                  <th className="py-3 pr-4 font-medium">Purpose</th>
                  <th className="py-3 pr-4 font-medium">
                    Categories of Personal Data
                  </th>
                  <th className="py-3 font-medium">Legal Basis</th>
                </tr>
              </thead>
              <tbody className="align-top text-neutral-300">
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">Delivery of websites and web apps</td>
                  <td className="py-3 pr-4">Name, email, project data</td>
                  <td className="py-3">Performance of a contract</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">Hosting services and support</td>
                  <td className="py-3 pr-4">
                    Name, address, technical log data
                  </td>
                  <td className="py-3">Performance of a contract</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">Copywriting and content creation</td>
                  <td className="py-3 pr-4">
                    Contact details, publication data
                  </td>
                  <td className="py-3">Consent / Legitimate interest</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">
                    MSP services (Microsoft 365)
                  </td>
                  <td className="py-3 pr-4">
                    Email addresses, accounts, settings
                  </td>
                  <td className="py-3">
                    Performance of a contract / Legal obligation
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">Client management and invoicing</td>
                  <td className="py-3 pr-4">Name, address, email</td>
                  <td className="py-3">Legal obligation</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">Website improvement</td>
                  <td className="py-3 pr-4">IP address, click behavior</td>
                  <td className="py-3">Legitimate interest (optimization)</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">Marketing and communication</td>
                  <td className="py-3 pr-4">Email, preferences</td>
                  <td className="py-3">Consent</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Analytics</td>
                  <td className="py-3 pr-4">Behavioral data</td>
                  <td className="py-3">Legitimate interest (analytics)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 4. Processors and Third Parties
          </h2>
          <p>We engage the following parties as processors:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Stripe, Inc. - Payment processing</li>
            <li>Supabase, Inc. - Database management and authentication</li>
            <li>PostHog, Inc. - Analytics</li>
            <li>Microsoft - MSP services (Microsoft 365)</li>
            <li>
              Hosting providers (for example Vercel, Netlify, DigitalOcean) -
              Web hosting
            </li>
            <li>
              Email providers (for example SendGrid, Outlook) - Email handling
            </li>
          </ul>
          <p>A complete list of processors is available upon request.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 5. Retention Periods
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Project and client data: 5 years after termination of the
              collaboration
            </li>
            <li>Invoices: 7 years (fiscal retention requirement)</li>
            <li>
              Analytics data: maximum of 2 years (anonymized where possible)
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 6. Security Measures
          </h2>
          <p>
            Amrio implements appropriate technical and organizational measures,
            including:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>SSL/TLS encryption</li>
            <li>Two-factor authentication (2FA) for admin accounts</li>
            <li>Access control at database level</li>
            <li>Logging and monitoring</li>
            <li>Regular security audits</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 7. International Data Transfers
          </h2>
          <p>
            Data may be processed outside the European Economic Area (EEA). This
            is done only with appropriate safeguards in place, such as Standard
            Contractual Clauses (SCCs) or based on an adequacy decision by the
            European Commission.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 8. Cookies and Similar Technologies
          </h2>
          <p>See our Cookie Policy.</p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 9. Your Rights
          </h2>
          <p>You have the right to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Access your personal data</li>
            <li>Rectify or delete your data</li>
            <li>Restrict or object to processing</li>
            <li>Data portability</li>
            <li>Withdraw previously given consent</li>
          </ul>
          <p>
            You can exercise these rights by contacting us at{" "}
            <a
              href="mailto:info@amrio.nl"
              className="underline underline-offset-4"
            >
              info@amrio.nl
            </a>
            .
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 10. Complaints
          </h2>
          <p>
            You can direct complaints to the Data Protection Authority via{" "}
            <a
              href="https://www.autoriteitpersoonsgegevens.nl/"
              className="underline underline-offset-4"
            >
              www.autoriteitpersoonsgegevens.nl
            </a>
            .
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Portal-specific Authentication and Account Data
          </h2>
          <p>
            For access to the Amrio Portal, we process account and security data
            needed to authenticate users and protect the platform.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Email and password when signing in with basic credentials through
              Supabase Authentication
            </li>
            <li>
              Name, email address, and profile image when supplied through a
              federated identity provider such as Google or Microsoft Azure
              Active Directory / Microsoft
            </li>
            <li>
              User profile data stored in the portal, including first name, last
              name, email address, avatar, onboarding status, tenant access, and
              role assignments
            </li>
            <li>
              Security data such as 2FA enrollment state, authenticator factor
              identifiers, session state, and password reset activity
            </li>
            <li>
              Technical and audit data such as account-related event logs,
              timestamps, selected tenant and website cookies, and uploaded
              profile image paths
            </li>
          </ul>
          <p>
            Based on the current implementation of this portal, the main user
            profile fields stored in the application database are first name,
            last name, email address, avatar, onboarding status, and internal
            user ID. The portal also stores tenant-related business information
            where relevant to service delivery, such as organization name,
            contact email, address details, phone number, VAT number, and
            website.
          </p>
          <p>
            We use this data to sign users in, maintain secure sessions, assign
            access to tenants and websites, support account recovery, protect
            accounts with MFA, and maintain security and administrative audit
            trails.
          </p>
          <p>
            We do not sell personal data collected through the portal.
          </p>
        </section>

        <div className="mt-8">
          <Link
            href="/"
            className="text-sm underline underline-offset-4 text-neutral-200 hover:text-white"
          >
            Back to portal
          </Link>
        </div>
      </div>
    </main>
  );
}
