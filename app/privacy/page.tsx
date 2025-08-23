import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import React from 'react'

function H1({ children }: React.PropsWithChildren) {
  return <h1 className="text-3xl font-bold">{children}</h1>
}

function H2({ children }: React.PropsWithChildren) {
  return <h1 className="mt-6 text-lg font-bold">{children}</h1>
}

function H3({ children }: React.PropsWithChildren) {
  return <h3 className="mt-2 font-bold">{children}</h3>
}

function SpanH3({ children }: React.PropsWithChildren) {
  return <span className="font-bold">{children}</span>
}

function Paragraph({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <p className={cn('text-sm', className)}>{children}</p>
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl py-16">
      <H1>Pickle: Privacy Policy</H1>
      <Paragraph>
        This privacy policy (&apos;Privacy Policy&apos;) governs how we, Live
        Momentum Ltd. and/or any other member of the StreamElements group
        (together, &quot;StreamElements&quot;, &quot;we&quot;, &quot;our&quot;
        or &quot;us&quot;) use, collect and store Personal Data we collect or
        receive from or about you (&quot;User&quot;, &quot;you&quot;) such as in
        the following use cases:
      </Paragraph>
      <br />
      <ul>
        <li>
          <span className="font-bold">1.</span> When you browse or visit our
          website, https://pickle.pw/ (&apos;Website&apos;);
        </li>
        <li>
          <span className="font-bold">2.</span> When you make use of, or
          interact with, our Website
        </li>
        <ul>
          <li>
            <span className="font-bold">2.1.</span> When you create an account
            and/or log in clicking on &quot;Connect with Twitch&quot;
          </li>
          <li>
            <span className="font-bold">2.2.</span> When you create an account
            and/or log in clicking on &quot;Connect with YouTube&quot;
          </li>
          <li>
            <span className="font-bold">2.3.</span> When you create an account
            and/or log in clicking on &quot;Connect with Facebook&quot;
          </li>
          <li>
            <span className="font-bold">2.4.</span> When you create an account
            and/or log in clicking on &quot;Connect with Trovo&quot;
          </li>
          <li>
            <span className="font-bold">2.5.</span> When you click on the
            &apos;Join us&apos; tab and/or you join to &apos;Discord&apos; and
            you make use of &apos;StreamElements Chat Stats&apos;.
          </li>
          <li>
            <span className="font-bold">2.6.</span> When you download our
            software, and/or plugin and/or desktop app
          </li>
          <li>
            <span className="font-bold">2.7.</span> When you apply to join
            StreamElements DreamTeam
          </li>
          <li>
            <span className="font-bold">2.8.</span> When you sign up to and/or
            comment on our blog on &apos;Medium&apos;
          </li>
          <li>
            <span className="font-bold">2.9.</span> When you contact us (e.g.
            customer support, when you submit a request, chat with us or leave
            us a message)
          </li>
        </ul>
        <li>
          <span className="font-bold">3.</span> When you make use of, or
          interact with our Dashboard
        </li>
        <li>
          <span className="font-bold">4.</span> When you attend a marketing
          event and provide Personal Data
        </li>
        <li>
          <span className="font-bold">5.</span> When you exchange business cards
          with us
        </li>
        <li>
          <span className="font-bold">6.</span> When we use the Personal Data of
          our suppliers
        </li>
        <li>
          <span className="font-bold">7.</span> When we use the Personal Data of
          our customers
        </li>
        <li>
          <span className="font-bold">8.</span> When you interact with us on our
          social media profiles (e.g., Facebook, Instagram, X, LinkedIn, etc)
          and we use the publicly available information.
        </li>
      </ul>
      We greatly respect your privacy, which is why we make every effort to
      provide a platform that would live up to the highest of user privacy
      standards. Please read this Privacy Policy carefully, so you can fully
      understand our practices in relation to Personal Data. &quot;Personal
      Data&quot; means any information that can be used, alone or together with
      other data, to uniquely identify any living human being. Please note that
      this is a master privacy policy and some of its provisions only apply to
      individuals in certain jurisdictions. For example, the legal basis in the
      table below is only relevant for GDPR-protected individuals.
      <H2>Table of contents:</H2>
      <ul>
        <li>
          <span className="font-bold">1.</span> What information we collect, why
          we collect it, and how it is used
        </li>
        <li>
          <span className="font-bold">2.</span> How we protect and store your
          Personal Data
        </li>
        <li>
          <span className="font-bold">3.</span> How we share your Personal Data
        </li>
        <li>
          <span className="font-bold">4.</span> Additional information regarding
          transfers of Personal Data
        </li>
        <li>
          <span className="font-bold">5.</span> Your rights
        </li>
        <li>
          <span className="font-bold">6.</span> Use by children
        </li>
        <li>
          <span className="font-bold">7.</span> Public information about your
          activity on the services
        </li>
        <li>
          <span className="font-bold">8.</span> How can I delete my account?
        </li>
        <li>
          <span className="font-bold">9.</span> Links to and interaction with
          third party product
        </li>
        <li>
          <span className="font-bold">10.</span> Log files
        </li>
        <li>
          <span className="font-bold">11.</span> Cookies and other tracking
          technologies
        </li>
        <li>
          <span className="font-bold">12.</span> Use of Analytics Tools
        </li>
        <li>
          <span className="font-bold">13.</span> California privacy rights
        </li>
        <li>
          <span className="font-bold">14.</span> Our California do not track
          notice
        </li>
        <li>
          <span className="font-bold">15.</span> Deletion of content from
          California residents
        </li>
        <li>
          <span className="font-bold">16.</span> How to contact us
        </li>
      </ul>
      This Privacy Policy may be updated from time to time and therefore we ask
      you to check back periodically for the latest version of the Privacy
      Policy, as indicated below. If there will be any significant changes made
      to the use of your Personal Data in a manner different from that stated at
      the time of collection, we will notify you by posting a notice on our
      Website or by other means.
      <H3>
        What information we collect, why we collect it, and how it is used.
      </H3>
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableCell className="font-bold">Data we collect</TableCell>
            <TableCell className="font-bold">
              Why is the data collected and for what purposes?
            </TableCell>
            <TableCell className="font-bold">Legal basis (GDPR only)</TableCell>
            <TableCell className="font-bold">
              Third parties with whom we share your data
            </TableCell>
            <TableCell className="font-bold">Period of storage</TableCell>
            <TableCell className="font-bold">
              Consequences of not providing the data
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={6} className="font-bold">
              When you browse or visit our Website
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cookies</TableCell>
            <TableCell>Read our Cookies Policy</TableCell>
            <TableCell>Legitimate interest (e.g. essential cookies)</TableCell>
            <TableCell>Read our Cookies Policy</TableCell>
            <TableCell>Read our Cookies Policy</TableCell>
            <TableCell>Read our Cookies Policy</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <H3>When you make use of, or interact with our Website</H3>
      <Table className="text-xs">
        <TableBody>
          <TableRow>
            <TableCell>
              <ul>
                <li>
                  <span className="font-bold">1.</span> Username
                </li>
                <li>
                  <span className="font-bold">2.</span> Email address
                </li>
                <li>
                  <span className="font-bold">3.</span> IP address
                </li>
                <li>
                  <span className="font-bold">4.</span> Stream data (channel
                  information, subscribers information)
                </li>
                <li>
                  <span className="font-bold">5.</span> Any other data you
                  decide to provide/supply
                </li>
              </ul>
            </TableCell>
            <TableCell>
              <ul>
                <li>
                  <span className="font-bold">1.</span> Signing up and creating
                  an account
                </li>
                <li>
                  <span className="font-bold">2.</span> Sending stream reports
                </li>
                <li>
                  <span className="font-bold">3.</span> To use our system
                  features, such as showing alerts, widgets, the bot and other
                  features we offer the user
                </li>
              </ul>
            </TableCell>
            <TableCell>
              Processing is necessary for the performance of a contract to which
              the data subject is party or in order to take steps at the request
              of the data subject prior to entering into a contract. Legitimate
              interest (e.g. sign you up to our service) 3rd party platforms:
            </TableCell>
            <TableCell>
              3rd party platforms:
              <ul>
                <li>
                  <span className="font-bold">1.</span> AWS (hosting services,
                  USA)
                </li>
                <li>
                  <span className="font-bold">2.</span> Heap (business
                  intelligence services, USA)
                </li>
              </ul>
            </TableCell>
            <TableCell>
              Until we no longer need the information and proactively delete it
              or you send a valid deletion request. Please note that we may
              retain it for a longer or shorter period in accordance with data
              retention laws.Please note that we may retain it for a longer or
              shorter period in accordance with data retention laws
            </TableCell>
            <TableCell>
              <ol>
                <li>&bull; Cannot sign up and create an account</li>
                <li>&bull; Cannot receive stream reports</li>
                <li>&bull; Cannot use our system features</li>
              </ol>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <H3>When you click on &quot;Connect with Twitch&quot;</H3>
      <Table className="text-xs">
        <TableBody>
          <TableRow>
            <TableCell>
              <ul>
                <li>
                  <span className="font-bold">1.</span> Username
                </li>
                <li>
                  <span className="font-bold">2.</span> Email address
                </li>
                <li>
                  <span className="font-bold">3.</span> IP address
                </li>
                <li>
                  <span className="font-bold">4.</span> Stream data (channel
                  information, subscribers information)
                </li>
                <li>
                  <span className="font-bold">5.</span> Any other data you
                  decide to provide/supply
                </li>
              </ul>
            </TableCell>
            <TableCell>Sending marketing communications</TableCell>
            <TableCell>Consent</TableCell>
            <TableCell>
              3rd party platforms:
              <ul>
                <li>
                  <span className="font-bold">1.</span> AWS (hosting services,
                  USA)
                </li>
                <li>
                  <span className="font-bold">2.</span> Heap (business
                  intelligence services, USA)
                </li>
              </ul>
            </TableCell>
            <TableCell>
              Until we no longer need the information and proactively delete it
              or you send a valid deletion request. Please note that we may
              retain it for a longer or shorter period in accordance with data
              retention laws.Please note that we may retain it for a longer or
              shorter period in accordance with data retention laws
            </TableCell>
            <TableCell>Cannot send you marketing communications</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      When you click on &quot;Connect with YouTube&quot; Username Email address
      IP address Stream data (channel information, subscribers information) Any
      other data you decide to provide/supply Signing up and creating an account
      Sending stream reports Processing is necessary for the performance of a
      contract to which the data subject is party or in order to take steps at
      the request of the data 3rd party platforms: AWS (hosting services, USA)
      Heap (business intelligence services, USA) Until we no longer need the
      information and proactively delete it or you send a valid deletion
      request. Please note that we may retain it for a longer or shorter period
      in accordance with data retention laws. Cannot sign up and create an
      account Cannot receive stream reports When you click on the &apos;Join
      us&apos; tab and/or you join to &apos;Discord&apos; and you make use of
      &apos;StreamElements Chat Stats&apos; Username Email address IP address
      Stream data (channel information, subscribers information) Any other data
      you decide to provide/supply Chat in the StreamElements group on Discord
      Receive information about us Processing is necessary for the performance
      of a contract to which the data subject is party or in order to take steps
      at the request of the data subject prior to entering into a contract
      Legitimate interest (e.g. respond to a query sent by you) 3rd party
      platforms: AWS (hosting services, USA) Heap (business intelligence
      services, USA) Discord (chat platform, USA) Until we no longer need the
      information and proactively delete it or you send a valid deletion
      request. Please note that we may retain it for a longer or shorter period
      in accordance with data retention laws.Please note that we may retain it
      for a longer or shorter period in accordance with data retention laws.
      Cannot chat in the StreamElements group on Discord Cannot receive
      information about us When you download our software, plug-ins (and app(s))
      Username Stream data (IP address, channel information, subscribers
      information and other metadata) Download our software, plug-ins and apps
      Sending stream reports Processing is necessary for the performance of a
      contract to which the data subject is party or in order to take steps at
      the request of the data subject prior to entering into a contract
      Legitimate interest (e.g. respond to a query sent by you) 3rd party
      platforms: AWS (hosting services, USA) Heap (business intelligence
      services, USA) Until we no longer need the information and proactively
      delete it or you send a valid deletion request. Please note that we may
      retain it for a longer or shorter period in accordance with data retention
      laws.Please note that we may retain it for a longer or shorter period in
      accordance with data retention laws. Cannot download our software,
      plug-ins and apps Cannot receive stream reports When you apply to join
      StreamElements DreamTeam Username Email address Join the StreamElements
      DreamTeam Sending marketing communications Processing is necessary for the
      performance of a contract to which the data subject is party or in order
      to take steps at the request of the data subject prior to entering into a
      contract Legitimate interest (e.g. add you to our StreamElements
      DreamTeam) 3rd party platforms: AWS (hosting services, USA) Heap (business
      intelligence services, USA) Until we no longer need the information and
      proactively delete it or you send a valid deletion request. Please note
      that we may retain it for a longer or shorter period in accordance with
      data retention laws.Please note that we may retain it for a longer or
      shorter period in accordance with data retention laws Cannot join the
      StreamElements DreamTeam Cannot send you marketing communications When you
      sign up to or comment on our blog on &apos;Medium&apos; Username Email
      address IP address To post your comments/response in our blog The data
      subject has given consent to the processing of his or her personal data
      for one or more specific purposes Legitimate interest (e.g. to post your
      comment on our blog) 3rd party platforms: AWS (hosting services, USA) Heap
      (business intelligence services, USA) Until we no longer need the
      information and proactively delete it or you send a valid deletion
      request. Please note that we may retain it for a longer or shorter period
      in accordance with data retention laws. Cannot post your comments/response
      in our blog When you contact us (e.g. customer support, when you submit a
      request, chat with us or leave us a message) Username Provider Channel Id
      Country Email Address Any other data you decide to provide/supply Process
      your request To assist you with your query The data subject has given
      consent to the processing of his or her personal data for one or more
      specific purposes Legitimate interest (e.g. to post your comment on our
      blog) 3rd party platforms: AWS (hosting services, USA) Heap (business
      intelligence services, USA) Zendesk (chat services) Until we no longer
      need the information and proactively delete it or you send a valid
      deletion request. Please note that we may retain it for a longer or
      shorter period in accordance with data retention laws. Cannot assist you
      and respond your query When you sign up/login to, make use of, or interact
      with our Dashboard Username Email address IP address Stream data (channel
      information, subscribers information) Any other data you decide to
      provide/supply Use our dashboard Processing is necessary for the
      performance of a contract to which the data subject is party or in order
      to take steps at the request of the data subject prior to entering into a
      contract Legitimate interest (e.g. respond to a query sent by you) 3rd
      party platforms: AWS (hosting services, USA) Heap (business intelligence
      services, USA) Until we no longer need the information and proactively
      delete it or you send a valid deletion request. Please note that we may
      retain it for a longer or shorter period in accordance with data retention
      laws. Cannot use our dashboard When you attend a marketing event and
      provide Personal Data Full name Email address Company address Any other
      data you decide to provide/supply Establishing a business connection
      Sending marketing communications. Processing is necessary for the
      performance of a contract to which the data subject is party or in order
      to take steps at the request of the data subject prior to entering into a
      contract (e.g. showing you certain products and features that you have
      shown an interest in). Legitimate interest (certain B2B marketing
      communications) The data subject has given consent to the processing of
      his or her personal data for one or more specific purposes 3rd party
      platforms: AWS (hosting services, USA) Heap (business intelligence
      services, USA) Until we no longer need the information and proactively
      delete it or you send a valid deletion request. Please note that we may
      retain it for a longer or shorter period in accordance with data retention
      laws. Cannot establish a business connection Cannot send you marketing
      communications When we use the Personal Data of our suppliers Full name
      Email address Username Any other data you decide to provide/supply
      Providing our services Performing the agreement Processing is necessary
      for the performance of a contract to which our customer is a party.
      Compliance with a legal obligation (e.g. tax laws, bookkeeping laws,
      etc.). Legitimate interest (e.g. send you contract-related communications)
      3rd party platforms: AWS (hosting services, USA) Heap (business
      intelligence services, USA) Until we no longer need the information and
      proactively delete it or you send a valid deletion request. Please note
      that we may retain it for a longer or shorter period in accordance with
      data retention laws. Cannot provide our services Cannot communicate with
      you Cannot perform the agreement When you interact with us on our social
      media profiles (e.g. Facebook, Twitter, LinkedIn, etc) and we use the
      publically available information Full name Email address Company name
      Establishing a business connection Send you information about us The data
      subject has given consent to the processing of his or her personal data
      for one or more specific purposes Legitimate interest (e.g. send you more
      information about us) 3rd party platforms: AWS (hosting services, USA)
      Heap (business intelligence services, USA) Until we no longer need the
      information and proactively delete it or you send a valid deletion
      request. Please note that we may retain it for a longer or shorter period
      in accordance with data retention laws. Cannot establish a business
      connection Cannot send you information about us How do we protect and
      store your personal data Security. We have implemented appropriate
      technical, organizational and security measures designed to reduce the
      risk of accidental destruction or loss, or the unauthorized disclosure or
      access to such information appropriate to the nature of the information
      concerned. However, please note that we cannot guarantee that the
      information will not be exposed as a result of unauthorized penetration to
      our servers. As the security of information depends in part on the
      security of the computer, device or network you use to communicate with us
      and the security you use to protect your user IDs and passwords, please
      make sure to take appropriate measures to protect this information.
      Retention of your Personal Data. In addition to the retention periods
      mentioned in Section 1 above, in some circumstances we may store your
      Personal Data for longer periods of time, for example (i) where we are
      required to do so in accordance with legal, regulatory, tax or accounting
      requirements, or (ii) for us to have an accurate record of your dealings
      with us in the event of any complaints or challenges, or (iii) if we
      reasonably believe there is a prospect of litigation relating to your
      Personal Data or dealings. How we share your personal data In addition to
      the recipients described in Section 1, we may share your information as
      follows: To the extent necessary, with regulators, to comply with all
      applicable laws, regulations and rules, and requests of law enforcement,
      regulatory and other governmental agencies or if required to do so by
      court order;
      https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en
      Internal transfers: We ensure transfers within the StreamElements group
      will be covered by an agreement entered into by members of the
      StreamElements group (an intra-group agreement) which contractually
      obliges each member to ensure that Personal Data receives an adequate and
      consistent level of protection wherever it is transferred to; External
      transfers: Where we transfer your Personal Data outside of EU/EEA, for
      example to third parties who help provide our products and services, we
      will obtain contractual commitments from them to protect your Personal
      Data; Some of these assurances are well recognized certification schemes
      like the EU - US Privacy Shield for the protection of Personal Data
      transferred from within the EU to the United States; or Where we receive
      requests for information from law enforcement or regulators, we carefully
      validate these requests before any Personal Data is disclosed. Additional
      information regarding transfers of personal data To the extent necessary,
      with regulators, to comply with all applicable laws, regulations and
      rules, and requests of law enforcement, regulatory and other governmental
      agencies or if required to do so by court order; If, in the future, we
      sell or transfer some or all of our business or assets to a third party,
      we will (to the minimum extent required) disclose information to a
      potential or actual third party purchaser of our business or assets. In
      the event that we are acquired by or merged with a third party entity, or
      in the event of bankruptcy or a comparable event, we reserve the right to
      transfer or assign Personal Data in connection with the foregoing events.
      Where you have provided your consent to us sharing the Personal Data (e.g.
      where you provide us with marketing consents or opt-in to optional
      additional services or functionality); and Where we receive requests for
      information from law enforcement or regulators, we carefully validate
      these requests before any Personal Data is disclosed. Your rights The
      following rights (which may be subject to certain exemptions or
      derogations), shall apply to certain individuals (some of which only apply
      to individuals protected by the GDPR): You have a right to access
      information held about you. Your right of access would normally be
      exercised free of charge, however, we reserve the right to charge an
      appropriate administrative fee where permitted by applicable law; You have
      the right to request that we amend any Personal Data we hold that it is
      inaccurate or misleading You have the right to request the erasure of the
      Personal Data that relates to you. Please note that there may be
      circumstances in which we are required to retain your data, for example
      for the establishment, exercise or defense of legal claims; The right to
      object to or to request restriction of the processing. However, there may
      be circumstances in which we are legally entitled to refuse your request;
      The right to data portability. This means that you may have the right to
      receive your Personal Data in a structured, commonly used and
      machine-readable format, and that you have the right to transmit that data
      to another controller; You have the right to object to profiling; You have
      a right to lodge a complaint with your local data protection supervisory
      authority (i.e., your place of habitual residence, place or work or place
      of alleged infringement) at any time. We ask that you please attempt to
      resolve any issues with us before you contact your local supervisory
      authority The right to withdraw your consent. Please note that there may
      be circumstances in which we are entitled to continue processing your
      data, in particular if the processing is required to meet our legal and
      regulatory obligations. You also have a right to request details of the
      basis on which your Personal Data is transferred outside the European
      Economic Area, but you acknowledge that data transfer agreements may need
      to be partially redacted for reasons of commercial confidentiality You can
      exercise your rights by contacting us atprivacy@streamelements.com.
      Subject to legal and other permissible considerations, we will make every
      reasonable effort to honor your request promptly or inform you if we
      require further information in order to fulfil your request. When
      processing your request, we may ask you for additional information to
      confirm your identity and for security purposes, before disclosing the
      Personal Data requested to you. We reserve the right to charge a fee where
      permitted by law, for instance if your request is manifestly unfounded or
      excessive. In the event that your request would adversely affect the
      rights and freedoms of others (for example, would impact the duty of
      confidentiality we owe to others) or if we are legally entitled to deal
      with your request in a different way than initial requested, we will
      address your request to the maximum extent possible, all in accordance
      with applicable law. Use by children The services are not structured to
      attract children under the age of 13 years. Accordingly, we do not intend
      to collect Personal Information from anyone we know to be under 13 years.
      If we learn that we have collected Personal Information from a child under
      13 years, we will delete that information as quickly as possible. If you
      believe that we might have any such information, please contact us at
      privacy@streamelements.com. Some of your activity on and through the
      Services is public by default. This may include, but is not limited to,
      content you have posted publicly on the Website or otherwise through the
      Services. Registered users may have some of this information associated
      with their Accounts. Unregistered users will not have this association,
      but information concerning their use of the Services (such as what pages
      they have visited) may be tracked anonymously through the use of cookies
      and stored by us. Please also remember that if you choose to provide
      Personal Information using certain public features of the Services, then
      that information is governed by the privacy settings of those particular
      features and may be publicly available. Individuals reading such
      information may use or disclose it to other individuals or entities
      without our control and without your knowledge, and search engines may
      index that information. We therefore urge you to think carefully about
      including any specific information you may deem private in content that
      you create or information that you submit through the Services. How can I
      delete my account? Should you ever decide to delete your Account, you may
      do so by emailingprivacy@streamelements.com. If you terminate your
      Account, any association between your Account and information we store
      will no longer be accessible through your Account. However, given the
      nature of sharing on the Services, any public activity on your Account
      prior to deletion will remain stored on our servers and will remain
      accessible to the public. In addition to our normal procedure for stored
      data deletion, you can revoke our access to your data via the Google
      security settings page,
      athttps://security.google.com/settings/security/permissions. Links to and
      interaction with third party products The Website may enable you to
      interact with or contain links to your Third Party Account and other third
      party websites, mobile software applications and services that are not
      owned or controlled by us (each a &quot;Third Party Service&quot;). We use
      the YouTube API Services. We are not responsible for the privacy practices
      or the content of such Third Party Services. Please be aware that Third
      Party Services may collect Personal Information from you. Accordingly, we
      encourage you to read the terms and conditions and privacy policy of each
      Third Party Service that you choose to use or interact with. Log files We
      may make use of log files. The information inside the log files includes
      internet protocol (IP) addresses, type of browser, Internet Service
      Provider (ISP), date/time stamp, referring/exit pages, clicked pages and
      any other information your browser may send to us. We may use such
      information to analyze trends, administer the Website, track users&apos;
      movement around the Website, and gather demographic information. Cookies
      and other tracking technologies Our Website may utilize
      &quot;cookies&quot;, anonymous identifiers and other tracking technologies
      in order to for us to provide our Website and present you with information
      that is customized for you. A &quot;cookie&quot; is a small text file that
      may be used, for example, to collect information about activity on the
      Website. Certain cookies and other technologies may serve to recall
      Personal Information, such as an IP address, previously indicated by a
      user. Most browsers allow you to control cookies, including whether or not
      to accept them and how to remove them. You may set most browsers to notify
      you if you receive a cookie, or you may choose to block cookies with your
      browser. Analytic tools Google Analytics The Website may use a tool called
      &quot;Google Analytics&quot; to collect information about use of the
      Website. Google Analytics collects information such as how often users
      visit this Website, what pages they visit when they do so, and what other
      sites they used prior to coming to this Website. We use the information we
      get from Google Analytics to maintain and improve the Website and our
      products. We do not combine the information collected through the use of
      Google Analytics with personally identifiable information. Google&apos;s
      ability to use and share information collected by Google Analytics about
      your visits to this Website is restricted by the Google Analytics Terms of
      Service, available athttp://www.google.com/analytics/terms/us.html/, and
      the Google Privacy Policy, available at
      http://www.google.com/policies/privacy/collects and processes data
      specifically in connection with Google Analytics
      athttp://www.google.com/policies/privacy/partners/Analytics by downloading
      and installing the Google Analytics Opt-out Browser Add-on, available
      athttps://tools.google.com/dlpage/gaoptout/ Firebase Analytics We also use
      a similar tool called &quot;Google Analytics for Firebase&quot;. By
      enabling this tool, we enable the collection of data about App Users,
      including via identifiers for mobile devices (including Android
      Advertising ID and Advertising Identifier for iOS), cookies and similar
      technologies. We use the information we get from Google Analytics for
      Firebase to maintain and improve our App(s). We do not facilitate the
      merging of personally-identifiable information with non-personally
      identifiable information unless we have robust notice of, and your prior
      affirmative (i.e., opt-in) consent to, that merger. In addition, we bring
      to your attention that Google Analytics for Firebase&apos;s terms
      (available at https://firebase.google.com/terms/) Heap. The Website may
      use a tool called &quot;Heap Analytics&quot; which is a user behavioral
      analytics product and service. Heap collects and analyzes data about how
      users are interacting with our Website. Heap does this by collecting data
      on what users are doing, including but not limited to what webpages they
      visit, what users click on, where those users are located, what browser or
      platform those users are using. Heap is GDPR compliant, you can read
      further information
      onhttps://heapanalytics.com/blog/company/heaps-commitment-to-gdpr-and-data-privacy.
      California privacy rights California Civil Code Section 1798.83 permits
      our customers who are California residents to request certain information
      regarding our disclosure of Personal Information to third parties for
      their direct marketing purposes. To make such a request, please send an
      email to privacy@streamelements.com. Please note that we are only required
      to respond to one request per customer each year. Our California do not
      track notice We do not currently respond or take any action with respect
      to web browser &quot;do not track&quot; signals or other mechanisms that
      provide consumers the ability to exercise choice regarding the collection
      of personally identifiable information about an individual consumer&apos;s
      online activities over time and across third-party websites or online
      services. We may allow third parties, such as companies that provide us
      with analytics tools, to collect personally identifiable information about
      an individual consumer&apos;s online activities over time and across
      different websites when a consumer uses the Services. Deletion of content
      from California residents If you are a California resident under the age
      of 18 and a registered user, California Business and Professions Code
      Section 22581 permits you to remove content or Personal Information you
      have publicly posted. To remove, please send an email to
      privacy@streamelements.com.Please be aware that after removal you will not
      be able to restore removed content. In addition, such removal does not
      ensure complete or comprehensive removal of the content or Personal
      Information you have posted and that there may be circumstances in which
      the law does not require us to enable removal of content. Contact Us If
      you have any questions, concerns or complaints regarding our compliance
      with this notice and the data protection laws, or if you wish to exercise
      your rights, we encourage you to first contact us at
      privacy@streamelements.com.
    </div>
  )
}
