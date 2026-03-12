import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Tailwind,
  Img,
  Hr,
} from '@react-email/components';

interface ResetPasswordEmailProps {
  userName: string;
  resetLink: string;
  yourName?: string;
}

export const ResetPasswordEmail = ({
  userName,
  resetLink,
  yourName,
}: ResetPasswordEmailProps) => {
  const logoUrl = 'https://xjcvdiidvtccsmbwtdmh.supabase.co/storage/v1/object/public/amrio//logo.png';

  return (
    <Html lang="en">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans text-gray-800">
          <Container className="mx-auto my-10 p-8 bg-white rounded-lg max-w-md">

            {/* Logo + title */}
            <Section className="text-center mb-6">
              <Img
                src={logoUrl}
                width="120"
                height="120"
                alt="Amrio"
                className="mx-auto mb-4"
              />
              <Text className="text-2xl font-bold text-blue-600 m-0">
                Reset Your Password
              </Text>
            </Section>

            <Hr className="border-gray-200 my-6" />

            {/* Body */}
            <Section className="mb-6">
              <Text className="text-base leading-relaxed">
                Hi {userName},
              </Text>
              <Text className="text-base leading-relaxed">
                We received a request to reset the password for your account.
                Click the button below to choose a new password.
              </Text>
            </Section>

            {/* CTA */}
            <Section className="text-center my-8">
              <Button
                href={resetLink}
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-md"
              >
                Reset Password
              </Button>
            </Section>

            {/* Fallback link */}
            <Section className="mb-6">
              <Text className="text-sm text-gray-500">
                If the button above does not work, copy and paste this link into your browser:
              </Text>
              <Text className="text-sm text-blue-600 break-all">
                {resetLink}
              </Text>
            </Section>

            <Hr className="border-gray-200 my-6" />

            {/* Footer */}
            <Section className="text-center">
              <Text className="text-sm text-gray-500">
                If you did not request a password reset, you can safely ignore this email.
              </Text>
              <Text className="text-sm text-gray-500 mt-4">
                Best regards,
                <br />
                {yourName ? `${yourName} | Amrio Team` : "Amrio Team"}
              </Text>
              <Text className="text-xs text-gray-400 mt-4">
                This link is valid for 1 hour.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ResetPasswordEmail;