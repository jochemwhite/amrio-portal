import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export interface InviteUserEmailProps {
  yourName: string;
  setupLink: string;
  clientName: string;
  tenantName?: string;
  newTenant?: boolean;
}

export default function InviteUserEmail({
  yourName,
  setupLink,
  clientName,
  tenantName,
  newTenant = false,
}: InviteUserEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>You have been invited to the Amrio Portal.</Preview>
      <Tailwind>
        <Body className="bg-slate-100 py-10 font-sans text-slate-900">
          <Container className="mx-auto max-w-xl rounded-2xl bg-white px-8 py-10 shadow-sm">
            <Section>
              <Text className="m-0 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Amrio Portal
              </Text>
              <Text className="mb-0 mt-6 text-3xl font-semibold text-slate-950">
                Hi {clientName}
              </Text>
              <Text className="mb-0 mt-4 text-base leading-7 text-slate-700">
                You&apos;ve been invited to the Amrio Portal by {yourName}.
              </Text>
              {tenantName ? (
                <Text className="mb-0 mt-3 text-base leading-7 text-slate-700">
                  You&apos;re joining {tenantName}.
                </Text>
              ) : null}
              {!tenantName && newTenant ? (
                <Text className="mb-0 mt-3 text-base leading-7 text-slate-700">
                  You&apos;ll set up your company profile as part of the process.
                </Text>
              ) : null}
            </Section>

            <Section className="py-8">
              <Button
                href={setupLink}
                className="rounded-xl bg-slate-950 px-6 py-3 text-base font-medium text-white"
              >
                Set up your account
              </Button>
            </Section>

            <Section className="border-t border-slate-200 pt-6">
              <Text className="m-0 text-sm leading-6 text-slate-600">
                This link expires in 24 hours and can only be used once.
              </Text>
              <Text className="mb-0 mt-4 text-sm leading-6 text-slate-600">
                Need help? Contact <a href="mailto:info@amrio.nl">info@amrio.nl</a>.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
