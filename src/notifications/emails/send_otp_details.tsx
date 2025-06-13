// Import Tailwind
import { Tailwind } from '@react-email/tailwind'

// Import Footer component
import { Footer } from './components/Footer'

// Import components
import { Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from '@react-email/components'

interface SendOtpDetailsProps {
  otp?: string
}

export const SendOtpDetails = ({
  otp
}: SendOtpDetailsProps) => {

  // Get the support email
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@octonius.com'

  // Get the preview text
  const previewText = `${otp} is your Octonius login code`

  return (
    <Html>

      {/* Preview */}
      <Head />
      <Preview>{previewText}</Preview>

      {/* Content */}
      <Tailwind>
        <Body className="my-auto mx-auto font-sans p-4 mt-4">
          <Container className="bg-white border border-solid border-zinc-100 rounded mx-auto p-6 pb-2 max-w-[465px]">

            {/* Heading */}
            <Section>
              <Img
                src={`https://media.octonius.com/assets/icon.png`}
                width="35"
                height="35"
                alt="Octonius"
                className="order-first"
              />
              <Heading className="text-zinc-950 text-[30px] font-medium mb-1">
                Your confirmation code
              </Heading>
            </Section>

            {/* Body content */}
            <Section>
              <Text className="text-zinc-950 font-normal text-[16px] leading-[24px]">
                Your confirmation code is below - use it in your browser or app when asked, and we'll get you signed in.
              </Text>
              <Section className='py-4'>
                <Section className="bg-zinc-50 rounded-md text-center p-8">
                  <Text className="text-zinc-950 font-normal text-[30px] tracking-wider">
                    {otp}
                  </Text>
                </Section>
              </Section>
            </Section>
            <Section>
              <Text className="text-zinc-950 font-normal text-[16px] leading-[24px]">
                If you have trouble accessing your account, please contact support at{' '}
                <Link href={`mailto:${supportEmail}`} className="text-blue-600 no-underline">
                  {supportEmail}.
                </Link>
              </Text>
            </Section>
          </Container>

          {/* Footer */}
          <Footer />

        </Body>
      </Tailwind>
    </Html>
  )
}

SendOtpDetails.PreviewProps = {
  otp: "000000",
} as SendOtpDetailsProps

export default SendOtpDetails
