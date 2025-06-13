// Import components
import { Container, Img, Section, Text } from '@react-email/components'

export const Footer = () => {

  // Get the current year
  const current_year = new Date().getFullYear()

  // Return the footer
  return (
    <Container className="max-w-[465px] text-center mt-4">
      <Section className="mt-4">
        <Img src={`https://media.octonius.com/assets/icon.png`} width="35" height="35" alt="Octonius" className="mx-auto"/>
      </Section>
      <Text className="text-[12px] text-zinc-400">
        C/ de Bailèn 11, bajos, 08010 Barcelona
        <br />
        Copyright © {current_year} Octonius SL
      </Text>
    </Container>
  )
}