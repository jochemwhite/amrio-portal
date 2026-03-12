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
} from '@react-email/components';

interface WelcomePortalClientEmailProps {
  clientName: string;
  setupLink: string; // Renamed from loginLink to better reflect purpose
  yourName: string; // New prop for the sender's name
}

export const WelcomePortalClientEmail = ({
  clientName,
  setupLink,
  yourName,
}: WelcomePortalClientEmailProps) => {
  const logoUrl = 'https://xjcvdiidvtccsmbwtdmh.supabase.co/storage/v1/object/public/amrio//logo.png';

  return (
    <Html lang="en">
      <Head />
      <Tailwind>
        <Body className="bg-gray-100 font-sans text-gray-800">
          <Container className="mx-auto my-10 p-8 bg-white rounded-lg shadow-lg max-w-md">
            <Section className="text-center mb-6">
              {/* Logo for Amrio portal */}
              <Img
                src={logoUrl} // Using the provided absolute logo URL
                width="120"
                height="120"
                alt="Amrio portal Logo"
                className="mx-auto mb-4"
              />
              <Text className="text-2xl font-bold text-blue-600">
                Welcome to Amrio dashboard!
              </Text>
            </Section>

            <Section className="mb-6">
              <Text className="text-base leading-relaxed">
                Hi {clientName},
              </Text>
              <Text className="text-base leading-relaxed">
                You have been invited to set up your account on our platform. To get started, simply click the link below and follow the steps to complete your profile (such as adding a profile picture and setting your password).
              </Text>
            </Section>

            <Section className="text-center my-8">
              <Button
                href={setupLink}
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200"
              >
                Set Up Your Account
              </Button>
              {/* Alternative link if button does not work */}
              <Text className="text-sm mt-4 text-gray-600">
                If the button above does not work, please copy and paste this link into your browser:
                <br />
                <a href={setupLink} className="text-blue-600 underline break-all">
                  {setupLink}
                </a>
              </Text>
            </Section>

            <Section className="mt-6 text-center text-gray-600 text-sm">
              <Text>
                If you have any questions, feel free to reach out. We're excited to have you on board!
              </Text>
              <Text>
                Best regards,
                <br />
                {yourName} | Amrio Team
              </Text>
              <Text className="mt-4 text-xs">
                This email was sent to you because you were invited to set up an account on Amrio dashboard.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomePortalClientEmail;
