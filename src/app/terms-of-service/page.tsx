import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "General terms and conditions for the Amrio Portal.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#0e0e0e] px-4 py-12 text-neutral-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur md:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">
          Amrio Portal
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm leading-7 text-neutral-300">
          General Terms and Conditions of Amrio
        </p>
        <p className="mt-2 text-sm leading-7 text-neutral-400">
          Last updated: 24 June 2025
        </p>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 1. Definitions
          </h2>
          <p>
            1.1 Client: any natural or legal person who purchases services from
            Amrio.
          </p>
          <p>
            1.2 Services: design, development, hosting, copywriting, MSP
            services.
          </p>
          <p>
            1.3 Agreement: any arrangement between Amrio and the Client.
          </p>
          <p>
            1.4 Business Day: any day except Saturday, Sunday, and officially
            recognized public holidays in the Netherlands.
          </p>
          <p>
            1.5 Force Majeure: all external, unavoidable circumstances beyond
            reasonable control.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 2. Applicability
          </h2>
          <p>
            2.1 These terms and conditions apply to all offers, assignments, and
            Agreements. Deviating terms proposed by the Client are only valid if
            explicitly accepted in writing by Amrio.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 3. Quotations
          </h2>
          <p>
            3.1 Quotations are non-binding, valid for 30 days, and may be
            revised in the event of cost changes. Prices are exclusive of VAT
            unless explicitly stated otherwise.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 4. Formation and Execution
          </h2>
          <p>
            4.1 An Agreement is concluded after written confirmation (including
            by email) or upon (partial) payment. Oral agreements are only
            binding after written confirmation.
          </p>
          <p>
            4.2 Requests for additional work or changes must be documented in
            writing and will be invoiced at the applicable rates, unless agreed
            otherwise.
          </p>
          <p>
            4.3 Amrio shall perform the Services to the best of its ability and
            expertise.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 5. Payment
          </h2>
          <p>
            5.1 Payment via Stripe or invoice is due within 14 days of the
            invoice date.
          </p>
          <p>
            5.2 In the event of late or incomplete payment, the Client owes
            interest in accordance with the statutory commercial interest and
            the Dutch Collection Costs Act (Wet Incassokosten, WIK).
          </p>
          <p>
            5.3 Amrio reserves the right to request an advance payment (deposit)
            for larger projects.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 6. Delivery and Acceptance
          </h2>
          <p>
            6.1 Timeframes are indicative unless expressly agreed otherwise in
            writing. Exceeding such timeframes does not entitle the Client to
            compensation.
          </p>
          <p>
            6.2 Delivery shall take place via written notice. The Client has 14
            Business Days to report defects in writing; after this period, the
            Service shall be deemed accepted.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 7. Use and Content
          </h2>
          <p>
            7.1 The Client is responsible for all submitted content (text,
            photos, data) and guarantees that such content does not infringe on
            third-party rights.
          </p>
          <p>
            7.2 Amrio may reject or remove unlawful content. The Client
            indemnifies Amrio against all third-party claims related to the use
            of content provided by the Client.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 8. Liability
          </h2>
          <p>
            8.1 Exclusion of indirect damages, including but not limited to lost
            profits, missed savings, and reputational damage.
          </p>
          <p>
            8.2 Amrio&apos;s total liability is limited to the amount of the most
            recent payable invoice (up to a maximum of 2x the project value).
          </p>
          <p>
            8.3 Amrio is not liable for damage resulting from the use of
            software, unless due to intent or gross negligence by Amrio.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 9. Intellectual Property
          </h2>
          <p>
            9.1 All materials developed by Amrio (software, code, designs)
            remain the property of Amrio until full payment has been received.
            Afterward, the Client obtains a non-exclusive, worldwide right of
            use solely for the agreed purpose.
          </p>
          <p>
            9.2 For open-source components, the corresponding license terms
            remain fully applicable.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 10. Privacy and Data Processing
          </h2>
          <p>
            10.1 The processing of personal data is carried out in accordance
            with our Privacy Policy.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 11. Force Majeure
          </h2>
          <p>
            11.1 Force majeure includes, but is not limited to: outages,
            pandemics, strikes, cyberattacks, natural disasters, and transport
            disruptions.
          </p>
          <p>
            11.2 In case of force majeure, obligations are suspended for the
            duration of the situation. If the situation lasts longer than 60
            days, either party may terminate the Agreement in writing without
            further liability.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 12. Amendments to Terms
          </h2>
          <p>
            12.1 Changes to these terms will be published on our website at
            least 14 days before taking effect. Continued use of the Services
            after the effective date constitutes acceptance.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 13. Additional Provisions
          </h2>
          <p>
            13.1 Right of Withdrawal (Consumers): Consumers are entitled to a
            14-day withdrawal period after contract conclusion, unless they
            request immediate performance.
          </p>
          <p>
            13.2 Warranty: Amrio provides a 30-day warranty on delivered
            software, limited to fixing defects that were unknown at the time of
            acceptance.
          </p>
          <p>
            13.3 Termination: Ongoing Agreements may be terminated by the Client
            with a notice period of 30 days, unless agreed otherwise in writing.
            In case of early termination, Amrio may retain part of the agreed
            fee as compensation.
          </p>
          <p>
            13.4 Authorization: Persons or entities acting on behalf of the
            Client must be duly authorized in writing; Amrio is entitled to
            request proof of such authority.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 14. Forms and Consent to Data Collection
          </h2>
          <p>
            14.1 By filling out and submitting our contact or &quot;Hire Us&quot;
            forms (including digitally), the Client irrevocably agrees to these
            General Terms and Conditions.
          </p>
          <p>
            14.2 The Client grants Amrio permission to process and store the
            submitted (personal) data in accordance with our Privacy Policy, for
            the purposes of project quotations, client management, and marketing
            communication.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 15. Governing Law and Disputes
          </h2>
          <p>15.1 All Agreements are governed by Dutch law.</p>
          <p>
            15.2 Disputes shall preferably be resolved by mutual consultation.
            If this is not possible, disputes shall be submitted to the
            competent court in Amsterdam.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-neutral-300">
          <h2 className="text-lg font-semibold text-white">
            Article 16. Contact details
          </h2>
          <p>Amrio</p>
          <p>Chamber of Commerce: 83841636 | VAT: NL003879198B16</p>
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

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            href="/privacy-policy"
            className="underline underline-offset-4 text-neutral-200 hover:text-white"
          >
            Privacy Policy
          </Link>
          <Link
            href="/"
            className="underline underline-offset-4 text-neutral-200 hover:text-white"
          >
            Back to portal
          </Link>
        </div>
      </div>
    </main>
  );
}
