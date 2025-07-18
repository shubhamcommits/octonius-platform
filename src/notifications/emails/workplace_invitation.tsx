// Import Tailwind
import { Tailwind } from '@react-email/tailwind'

// Import Footer component
import { Footer } from './components/Footer'

// Import components
import { Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text, Button } from '@react-email/components'

interface WorkplaceInvitationProps {
  inviterName?: string
  workplaceName?: string
  invitationLink?: string
  message?: string
  expiresIn?: string
}

export const WorkplaceInvitation = ({
  inviterName = 'A colleague',
  workplaceName = 'Octonius',
  invitationLink = '',
  message = '',
  expiresIn = '7 days'
}: WorkplaceInvitationProps) => {

  // Get the support email
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@octonius.com'

  // Get the preview text
  const previewText = `${inviterName} invited you to join ${workplaceName} on Octonius`

  return (
    <Html>

      {/* Preview */}
      <Head />
      <Preview>{previewText}</Preview>

      {/* Content */}
      <Tailwind>
        <Body className="my-auto mx-auto font-sans p-4 mt-4">
          <Container className="bg-white border border-solid border-zinc-100 rounded mx-auto p-8 pb-4 max-w-[465px]">

            {/* Heading */}
            <Section className="text-center">
              <Img
                src={`https://media.octonius.com/assets/icon.png`}
                width="35"
                height="35"
                alt="Octonius"
                className="mx-auto mb-4"
              />
              <Heading className="text-zinc-950 text-[30px] font-medium mb-1 text-center">
                You're invited to join {workplaceName}
              </Heading>
            </Section>

            {/* Body content */}
            <Section>
              <Text className="text-zinc-950 font-normal text-[16px] leading-[24px]">
                Hi there,
              </Text>
              <Text className="text-zinc-950 font-normal text-[16px] leading-[24px]">
                {inviterName} has invited you to join <strong>{workplaceName}</strong> on Octonius, 
                a collaborative workspace platform where teams work together more effectively.
              </Text>
              
              {message && (
                <Section className="bg-zinc-50 rounded-md p-4 my-4">
                  <Text className="text-zinc-950 font-normal text-[14px] leading-[20px] italic">
                    "{message}"
                  </Text>
                  <Text className="text-zinc-500 font-normal text-[12px] leading-[16px]">
                    - {inviterName}
                  </Text>
                </Section>
              )}

              <Section className='py-4'>
                <Button
                  href={invitationLink}
                  className="bg-zinc-950 text-white font-medium text-[16px] px-6 py-3 rounded-md text-center no-underline block"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  Accept Invitation
                </Button>
              </Section>

              <Text className="text-zinc-500 font-normal text-[14px] leading-[20px] text-center">
                This invitation will expire in {expiresIn}.
              </Text>

              <Text className="text-zinc-950 font-normal text-[16px] leading-[24px]">
                If you're having trouble with the button above, copy and paste the URL below into your web browser:
              </Text>
              <Text className="text-blue-600 font-normal text-[14px] leading-[20px] break-all">
                {invitationLink}
              </Text>
            </Section>

            <Section>
              <Text className="text-zinc-950 font-normal text-[16px] leading-[24px]">
                If you have any questions or need assistance, please contact support at{' '}
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

WorkplaceInvitation.PreviewProps = {
  inviterName: "John Doe",
  workplaceName: "Acme Corporation",
  invitationLink: "https://app.octonius.com/invite/accept?token=sample-token",
  message: "Hey! We'd love to have you on our team. Looking forward to collaborating with you!",
  expiresIn: "7 days"
} as WorkplaceInvitationProps

export default WorkplaceInvitation 