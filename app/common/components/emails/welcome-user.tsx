import {
    Body,
    Button,
    Column,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Row,
    Section,
    Tailwind,
    Text,
  } from '@react-email/components';

  interface WelcomeUserProps {
    userName?: string;
    baseUrl?: string;
  }
  const baseUrl2=process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  console.log(baseUrl2);
  export const WelcomeUser = ({
    userName,
    baseUrl = baseUrl2,
  }: WelcomeUserProps) => {
    return (
      <Html>
        <Tailwind>
          <Head />
          <Body className="bg-white">
            <Preview>Welcome to MyYieldBank - Your Personal Investment Bank</Preview>
            <Container>
              <Section className="px-5 py-[30px]">
                <Img src={`${baseUrl}/static/MyYieldBank.png`} alt="MyYieldBank logo" width={200} />
              </Section>

              <Section className="border border-solid border-black/10 rounded overflow-hidden">
                <Row className="p-5 pb-0">
                  <Column>
                    <Heading className="text-[32px] font-bold text-center">
                      Welcome to MyYieldBank{userName ? `, ${userName}` : ''}!
                    </Heading>
                    <Heading
                      as="h2"
                      className="text-[26px] font-bold text-center mt-4"
                    >
                      Your Personal Investment Bank
                    </Heading>

                    <Text className="text-base mt-6">
                      We're thrilled to have you join us! MyYieldBank is your personal investment management platform where you are both the banker and the customer.
                    </Text>

                    <Text className="text-base mt-4">
                      <b>What you can do with MyYieldBank:</b>
                    </Text>

                    <Text className="text-base mt-2">
                      • Track your stock portfolio in real-time<br/>
                      • Set custom profit and loss targets for each holding<br/>
                      • Receive instant notifications when your targets are reached<br/>
                      • Monitor your investment performance with detailed analytics<br/>
                      • Keep a complete record of your trading history
                    </Text>

                    <Text className="text-base mt-6">
                      MyYieldBank doesn't make investment decisions for you—we simply monitor and record your investments according to the rules you set. You're in complete control.
                    </Text>

                    <Text className="text-base mt-4">
                      Ready to get started? Add your first stock holding and begin tracking your portfolio today!
                    </Text>
                  </Column>
                </Row>
                <Row className="p-5 pt-0">
                  <Column className="text-center" colSpan={2}>
                    <Button 
                      href="https://moneylab.blog/home"
                      className="bg-[#2563eb] rounded border border-solid border-black/10 text-white font-bold cursor-pointer inline-block px-[30px] py-3 no-underline"
                    >
                      Get Started
                    </Button>
                  </Column>
                </Row>
              </Section>

              <Section className="pt-[45px]">
                <Text className="text-base text-center">
                  Need help? Visit our support page or check out our documentation.
                </Text>
              </Section>

              <Text className="text-center text-xs leading-[24px] text-black/70 mt-8">
                © {new Date().getFullYear()} MyYieldBank | Your Personal Investment Bank<br/>
                This email was sent to welcome you to MyYieldBank. If you have any questions, please contact our support team.
              </Text>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };

  WelcomeUser.PreviewProps = {
    userName: 'John',
  } as WelcomeUserProps;
  
  export default WelcomeUser;
  