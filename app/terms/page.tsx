import { cn } from "@/lib/utils"
import React from "react"

function H1({ children }: React.PropsWithChildren) {
    return <h1 className="text-3xl font-bold">{children}</h1>
}

function H2({ children }: React.PropsWithChildren) {
    return <h1 className="text-lg font-bold mt-6">{children}</h1>
}

function H3({ children }: React.PropsWithChildren) {
    return <h3 className="font-bold mt-2">{children}</h3>
}

function SpanH3({ children }: React.PropsWithChildren) {
    return <span className="font-bold">{children}</span>
}

function Paragraph({ children, className }: React.PropsWithChildren<{ className?: string }>) {
    return <p className={cn("text-sm", className)}>{children}</p>
}

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto py-16">
            <H1>Pickle: Terms of Use</H1>
            <Paragraph>
                Welcome to pickle.pw (together with its subdomains and Content, the "Site"). The Site, together with the Pickle, Marks, App, Plug-In and services are collectively referred to as the "Services". Please read the following Terms of Use carefully before installing, downloading and/or using the Pickle software application (the "App") or plug-in (the "Plug-In") or using this Site or the Services so that you are aware of your legal rights and obligations with respect to Live Momentum Ltd., Pickle Inc., and any other member of the Pickle group ("Pickle", "we","our" or "us"). By accessing or using the Services, you expressly acknowledge and agree that you are entering a legal agreement with us and have understood and agree to comply with, and be legally bound by, these Terms of Use, together with the Privacy Policy (the "Terms"). You hereby waive any applicable rights to require an original (non-electronic) signature or delivery or retention of non-electronic records, to the extent not prohibited under applicable law. If you do not agree to be bound by these Terms please do not access or use the Services.
            </Paragraph>

            <H2>1. Modification</H2>
            <Paragraph>
                We reserve the right, at our discretion, to change these Terms at any time. Such change will be effective five (5) days following posting of the revised Terms on the Site, and your continued use of the Services thereafter means that you accept those changes.
            </Paragraph>

            <H2>2. Ability to Accept Terms</H2>
            <Paragraph>
                The Services are only intended for individuals aged thirteen (13) years or older. If you are under 13 years please do not visit or use the Services. If you are between 13 and 18 years of age, then you must review these Terms with your parent or guardian before visiting or using the Services to make sure that you and your parent or guardian understand these Terms and agree to them.
            </Paragraph>

            <H2>3. Services Access</H2>
            <Paragraph>
                For such time as these Terms are in effect, we hereby grant you permission to visit and use the Services provided that you comply with these Terms and applicable law. We reserve the right, at any time and for any reason (including, without limitation, for violations of these Terms or any other agreement you may have with us, actions or behavior taking place using our tools and Services, or on other platforms where our tools and Services may be made available), at our sole discretion, to: (1) temporarily revoke your access to visit and use the Services; (2) permanently revoke your access to visit and use the Services; and/or (3) limit your access to visit and use the Services.
            </Paragraph>

            <H2>4. Restrictions</H2>
            <Paragraph>
                You shall not: (i) copy, distribute or modify any part of the Services without our prior written authorization; (ii) use, modify, create derivative works of, transfer (by sale, resale, license, sublicense, download or otherwise), reproduce, distribute, display or disclose Content (defined below), except as expressly authorized herein; (iii) disrupt servers or networks connected to the Services; (iv) use or launch any automated system (including without limitation, "robots" and "spiders") to access the Services; and/or (v) circumvent, disable or otherwise interfere with security-related features of the Services or features that prevent or restrict use or copying of any Content or that enforce limitations on use of the Services.
            </Paragraph>

            <H2>5. Account</H2>
            <Paragraph>
                In order to use some of the services of the Site, App or Plug-In, you may have to create an account ("Account"). You agree not to create an Account for anyone else or use the account of another without their permission. When creating your Account, you must provide accurate and complete information. You are solely responsible for the activity that occurs in your Account, and you must keep your Account password secure. You must notify Pickle immediately of any breach of security or unauthorized use of your Account. As between you and Pickle, you are solely responsible and liable for the activity that occurs in connection with your Account. If you wish to delete your Account you may do it from the account page on the dashboard or send an email request to Pickle at <a href="reem@pickle.pw" target="_blank" className="text-blue-500">reem@pickle.pw</a>. We will deal with your request in accordance with applicable law.
            </Paragraph>

            <H2>6. Payments to Pickle</H2>
            <Paragraph>
                Except as expressly set forth in the Terms, your general right to access and use the Site is currently for free, but Pickle may in the future charge a fee for certain access or usage. You will not be charged for any such access or use of the Site unless you first agree to such charges, but please be aware that any failure to pay applicable charges may result in you not having access to some or all of the Site.
            </Paragraph>

            <H2>7. Tipping</H2>
            <Paragraph>
                Pickle's Services enable users that view online gaming streams ("Viewers") to transfer tips or donations ("Tips") to game streamers ("Streamers") and to submit requests to Streamers ("Requests"). Tips may be submitted by Viewers and processed through various third party payment processing services ("Payment Providers"), and additional terms may apply to such payments. In addition to these Terms, you agree that the terms and conditions of such Payment Providers shall apply to the online payments and provision and/or receipt of Tips. We reserve the right, at any time and for any reason, at our sole discretion, to:
                (1) change our available Tip-payment methods and/or our Payment Providers;
                (2) eliminate the option to give and/or receive Tips for any or all Viewers and/or Streamers;
                and (3) to limit the number and/or frequency of Tip-payment transactions permitted via the App and/or the Services.
                and (4) prevent Streamers from withdrawing or accessing Tips that are suspected by Pickle (at its sole discretion) to be fraudulent or to have been obtained via suspicious activity, such as without streaming, (and in either of such cases, Pickle shall use reasonable efforts to refund any such Tips to the Viewer who made such payment).
                Pickle shall in no event be responsible or liable for:
                (A) the availability and/or operation of any Payment Provider;
                (B) the acknowledgment or fulfillment of a Request by any Streamer;
                (C) any action or default by any Streamer or Viewer or any interaction between a Streamer and a Viewer;
                and (D) any unfulfilled Tip-payment transaction which results from incorrect payment information provided by the Viewer or which is made not in accordance with these terms.
                By offering a Tip, you, as a Viewer hereby confirm that:
                (i) you are using a valid credit card which is owned by you for the payment of the Tip and providing complete and accurate information in connection with the transaction;
                and (ii) no goods or services have been offered to you in consideration for the Tip and the Tip payment has not been solicited in any way. For all Tips transferred through SE.Pay, any request for cancelation or refund should be sent via email to <a href="support@pickle.pw" target="_blank" className="text-blue-500">support@pickle.pw</a>, subject to the fact that all Tip charges are non-refundable and cannot be withdrawn or charged back by Viewers. Viewers hereby confirm and acknowledge that Tips shall not be subject to or conditioned upon any consideration or benefit, including without limitation the performance of Requests. For Tips transferred through SE.Pay, when tipping a US-based Streamer, your payment is processed by Pickle Inc., and when tipping an EU-based Streamer, your payment is processed by Pickle GmbH. All SE.Pay related disputes, including refund requests, chargebacks and cancellations will be handled by Pickle.
            </Paragraph>

            <H2>8. Intellectual Property Rights</H2>

            <H3>8.1. End User License</H3>
            <Paragraph>
                Subject to the terms and conditions of these Terms, we hereby grant you a personal, revocable, non-exclusive, non-sublicensable, non-assignable, non-transferable license ("License") to: (i) download, install and use the App and/or Plug-In (as applicable) on a computer, mobile telephone or any other device you are using to access the Service (the "Device"); and (ii) access and use the Services on that Device in accordance with these Terms.
            </Paragraph>

            <H3>8.2. Content and Marks</H3>
            <Paragraph>
                The (i) content on the Services, including without limitation, the text, documents, articles, brochures, descriptions, products, software, graphics, photos, sounds, videos, interactive features, and services(collectively, the 'Materials'), (ii) and User Submissions, as defined below (together with the Materials, the 'Content'), and (iii) the trademarks, service marks and logos contained therein ('Marks'), are the property of Pickle and/or its licensors and may be protected by applicable copyright or other intellectual property laws and treaties. "Pickle", the Pickle logo, and other marks are Marks of Pickle or its affiliates. All other trademarks, service marks, and logos used on the Services are the trademarks, service marks, or logos of their respective owners. We reserve all rights not expressly granted in and to the Services and the Content.
            </Paragraph>

            <H3>8.3. License Restrictions</H3>
            <Paragraph>
                You agree not to, and shall not permit any third party to: (i) sublicense, redistribute, sell, lease, lend or rent the Services; (ii) make the Services available over a network where it could be used by multiple devices owned or operated by different people at the same time; (iii) disassemble, reverse engineer, decompile, decrypt, or attempt to derive the source code of, the Services; (iv) copy (except for back-up purposes), modify, improve, or create derivative works of the Services or any part thereof; (v) circumvent, disable or otherwise interfere with security-related features of the Services or features that prevent or restrict use or copying of any content or that enforce limitations on use of the Services; (vi) remove, alter or obscure any proprietary notice or identification, including copyright, trademark, patent or other notices, contained in or displayed on or via the Services; (vii) use any communications systems provided by the App to send unauthorized and/or unsolicited commercial communications; (viii) use the Pickle name, logo or trademarks without our prior written consent; and/or (ix) use the Services to violate any applicable laws, rules or regulations, or for any unlawful, harmful, irresponsible, or inappropriate purpose, or in any manner that breaches this Agreement.
            </Paragraph>

            <H2>9. User Submissions</H2>

            <H3>9.1. Responsibility</H3>
            <Paragraph>
                The Services permit the submission, hosting, sharing and publishing of Content by you and other users ('User Submissions'). You understand that whether or not such User Submissions are published, we do not guarantee any confidentiality with respect to any User Submissions. You shall be solely responsible for your User Submissions and the consequences of posting, publishing or uploading them. We have complete discretion whether to publish your User Submissions and we reserve the right in our sole discretion and without further notice to you, to monitor, censor, edit, remove, delete, and/or remove any and all Content posted on the Services (including User Submissions) at any time and for any reason.
            </Paragraph>

            <H3>9.2. Ownership</H3>
            <Paragraph>
                You represent and warrant that you own or have the necessary rights and permissions to use and authorize Pickle to use all Intellectual Property Rights (defined below) in and to your User Submissions, and to enable inclusion and use thereof as contemplated by the Services and these Terms. Unless the User Submissions are separately referred to, all references herein to Content shall include references to User Submissions."Intellectual Property Rights" means any and all rights, titles and interests, whether foreign or domestic, in and to any and all trade secrets, patents, copyrights, service marks, trademarks, know-how, or similar intellectual property rights, as well as any and all moral rights, rights of privacy, publicity and similar rights of any type under the laws or regulations of any governmental, regulatory, or judicial authority, foreign or domestic. You retain all of your ownership rights in and to your User Submissions.
            </Paragraph>

            <H3>9.3. License to User Submissions</H3>
            <Paragraph>
                By submitting the User Submissions to Pickle, you hereby grant Pickle a worldwide, irrevocable, non-exclusive, royalty-free, perpetual, sublicenseable and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform the User Submissions in connection with the Services and Pickle's business, including without limitation for publishing and redistributing part or all of your User Submissions (and derivative works thereof) in any media formats and through any media channels and, and you hereby waive any moral rights in your User Submissions, to the extent permitted by law. You also hereby grant each user of the Services or other viewer or user of the User Submission a non-exclusive right to use, reproduce, distribute, prepare derivative works of, display and perform such User Submissions, all in accordance with these Terms.
            </Paragraph>

            <H3>9.4. Prohibited Content</H3>
            <Paragraph>
                You agree that you will not display, post, submit, publish, upload or transmit a User Submission that: (i) is unfair or deceptive under the consumer protection laws of any jurisdiction; (ii) is copyrighted, protected by trade secret or otherwise subject to third party proprietary rights, including privacy and publicity rights, unless you are the owner of such rights; (iii) creates a risk to a person's safety or health, creates a risk to public safety or health, compromises national security, or interferes with an investigation by law enforcement; (iv) impersonates another person; (v) promotes illegal drugs, violates export control laws, relates to illegal gambling, or illegal arms trafficking; (vi) is unlawful, defamatory, libelous, threatening, pornographic, harassing, hateful, racially or ethnically offensive, or encourages conduct that would be considered a criminal offense, gives rise to civil liability, violates any law, or is inappropriate; (vii) involves theft or terrorism; or (viii) is otherwise malicious or fraudulent.
            </Paragraph>

            <H3>9.5. Exposure</H3>
            <Paragraph>
                Exposure. You understand and acknowledge that when accessing and using the Services: (i) you will be exposed to User Submissions from a variety of sources, and that Pickle is not responsible for the accuracy, usefulness, safety, or Intellectual Property Rights of, or relating to, such User Submissions; and (ii) you may be exposed to User Submissions that are inaccurate, offensive, indecent, or objectionable. You hereby agree to waive, and hereby do waive, any legal or equitable rights or remedies you may have against Pickle with respect to (i) and (ii) herein.
            </Paragraph>

            <H2>10. Information Description</H2>
            <Paragraph>
                We attempt to be as accurate as possible. However, we cannot and do not warrant that the Content available on the Services is accurate, complete, reliable, current, or error-free. We reserve the right to make changes in or to the Content, or any part thereof, in our sole judgment, without the requirement of giving any notice prior to or after making such changes to the Content. Your use of the Content, or any part thereof, is made solely at your own risk and responsibility.
            </Paragraph>

            <H2>11. Links</H2>
            <Paragraph>
                <SpanH3>11.1.</SpanH3>&nbsp;
                The Services may contain links, and may enable you to post content, to third party websites that are not owned or controlled by Pickle. We are not affiliated with, have no control over, and assume no responsibility for the content, privacy policies, or practices of, any third party websites. You: (i) are solely responsible and liable for your use of and linking to third party websites and any content that you may send or post to a third party website; and (ii) expressly release Pickle from any and all liability arising from your use of any third party website. Accordingly, we encourage you to read the terms and conditions and privacy policy of each third party website that you may choose to visit.
            </Paragraph>

            <Paragraph>
                <SpanH3>11.2.</SpanH3>&nbsp;
                Pickle permits you to link to the Site provided that: (i) you link to but do not replicate any page on the Site; (ii) the hyperlink text shall accurately describe the Content as it appears on the Site; (iii) you shall not misrepresent your relationship with Pickle or present any false information about Pickle and shall not imply in any way that we are endorsing any services or products, unless we have given you our express prior consent; (iv) you shall not link from a website ("Third Party Website") which prohibits linking to third parties; (v) such Third Party Website does not contain content that (a) is offensive or controversial (both at our discretion), or (b) infringes any intellectual property, privacy rights, or other rights of any person or entity; and/or (vi) you, and your website, comply with these Terms and applicable law.
            </Paragraph>

            <H2>12. Privacy</H2>
            <Paragraph>
                We will use any personal information that we may collect or obtain in connection with the Services in accordance with our privacy policy which is available at <a href="https://pickle.pw/privacy" target="_blank" className="text-blue-500">www.pickle.pw/privacy</a>. You agree that we may use personal information that you provide or make available to us in accordance with the Privacy Policy.
            </Paragraph>

            <H2>13. Warranty Disclaimers</H2>
            <Paragraph>
                <SpanH3>13.1.</SpanH3>&nbsp;
                This section applies whether or not the services provided under the Services are for payment. Applicable law may not allow the exclusion of certain warranties, so to that extent certain exclusions set forth herein may not apply.
            </Paragraph>

            <Paragraph>
                <SpanH3>13.2.</SpanH3>&nbsp;
                THE SERVICES ARE PROVIDED ON AN `AS IS` AND `AS AVAILABLE` BASIS, AND WITHOUT WARRANTIES OF ANY KIND EITHER EXPRESS OR IMPLIED. PICKLE HEREBY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, TITLE, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND THOSE ARISING BY STATUTE OR FROM A COURSE OF DEALING OR USAGE OF TRADE. PICKLE DOES NOT GUARANTEE THAT THE SERVICES WILL BE FREE OF BUGS, SECURITY BREACHES, OR VIRUS ATTACKS. THE SERVICES MAY OCCASIONALLY BE UNAVAILABLE FOR ROUTINE MAINTENANCE, UPGRADING, OR OTHER REASONS. YOU AGREE THAT PICKLE WILL NOT BE HELD RESPONSIBLE FOR ANY CONSEQUENCES TO YOU OR ANY THIRD PARTY THAT MAY RESULT FROM TECHNICAL PROBLEMS OF THE INTERNET, SLOW CONNECTIONS, TRAFFIC CONGESTION OR OVERLOAD OF OUR OR OTHER SERVERS. WE DO NOT WARRANT, ENDORSE OR GUARANTEE ANY CONTENT, PRODUCT, OR SERVICE THAT IS FEATURED OR ADVERTISED ON THE SERVICES BY A THIRD PARTY.
            </Paragraph>

            <Paragraph>
                <SpanH3>13.3.</SpanH3>&nbsp;
                PICKLE DOES NOT WARRANT, ENDORSE OR GUARANTEE ANY CONTENT THAT APPEARS IN A USER SUBMISSION, AND DOES NOT MAKE ANY REPRESENTATION OR WARRANTY WITH RESPECT TO, AND DISCLAIMS ALL LIABILITY FOR, ANY SUCH CONTENT.
            </Paragraph>

            <Paragraph>
                <SpanH3>13.4.</SpanH3>&nbsp;
                YOU SPECIFICALLY ACKNOWLEDGE THAT PICKLE SHALL NOT BE RESPONSIBLE FOR THE USER SUBMISSIONS OR CONDUCT (INCLUDING DEFAMATORY, OFFENSIVE, ILLEGAL, OR NEGLIGENT CONDUCT) OF ANY SERVICES USER AND THAT THE RISK OF HARM OR DAMAGE FROM THE FOREGOING RESTS ENTIRELY WITH YOU.
            </Paragraph>

            <Paragraph>
                <SpanH3>13.3.</SpanH3>&nbsp;
                YOUR RELIANCE ON, OR USE OF, ANY USER SUBMISSION, OR INTERACTION WITH ANY SERVICES USER OR OWNER, IS AT YOUR SOLE RISK. IF YOU HAVE A DISPUTE WITH ANY SERVICES USER OR OWNER IN CONNECTION WITH THE SERVICES OR ANY USER SUBMISSION, YOU AGREE THAT PICKLE IS NOT LIABLE FOR ANY CLAIMS OR DAMAGES ARISING OUT OF OR CONNECTED WITH SUCH A DISPUTE. PICKLE RESERVES THE RIGHT, BUT HAS NO OBLIGATION, TO MONITOR ANY SUCH DISPUTE.
            </Paragraph>

            <Paragraph>
                <SpanH3>13.5.</SpanH3>&nbsp;
                EXCEPT AS EXPRESSLY STATED IN OUR PRIVACY POLICY, PICKLE DOES NOT MAKE ANY REPRESENTATIONS, WARRANTIES OR CONDITIONS OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE SECURITY OF ANY INFORMATION YOU MAY PROVIDE OR ACTIVITIES YOU ENGAGE IN DURING THE COURSE OF YOUR USE OF THE SERVICES.
            </Paragraph>

            <Paragraph>
                <SpanH3>13.6.</SpanH3>&nbsp;
                EXCEPT AS EXPRESSLY STATED IN OUR PRIVACY POLICY, PICKLE DOES NOT MAKE ANY REPRESENTATIONS, WARRANTIES OR CONDITIONS OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE SECURITY OF ANY INFORMATION YOU MAY PROVIDE OR ACTIVITIES YOU ENGAGE IN DURING THE COURSE OF YOUR USE OF THE SERVICES.
            </Paragraph>

            <H2>14. Limitation of Liability</H2>
            <Paragraph>
                <SpanH3>14.1.</SpanH3>&nbsp;
                TO THE FULLEST EXTENT PERMISSIBLE BY LAW, PICKLE SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, EXEMPLARY, SPECIAL, CONSEQUENTIAL, OR INCIDENTAL DAMAGES OF ANY KIND, OR FOR ANY LOSS OF DATA, REVENUE, PROFITS OR REPUTATION, ARISING UNDER THESE TERMS OR OUT OF YOUR USE OF, OR INABILITY TO USE, THE SERVICES, EVEN IF PICKLE HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES OR LOSSES. Some jurisdictions do not allow the limitation or exclusion of liability for incidental or consequential damages, so the above limitations may not apply to you.
            </Paragraph>

            <Paragraph>
                <SpanH3>14.2.</SpanH3>&nbsp;
                IN NO EVENT SHALL THE AGGREGATE LIABILITY OF PICKLE FOR ANY DAMAGES ARISING UNDER THESE TERMS OR OUT OF YOUR USE OF, OR INABILITY TO USE, THE SERVICES EXCEED THE TOTAL AMOUNT OF FEES, IF ANY, PAID BY YOU TO PICKLE FOR USING THE SERVICES DURING THE THREE (3) MONTHS PRIOR TO BRINGING THE CLAIM.
            </Paragraph>

            <H2>15. Indemnity</H2>
            <Paragraph>
                You agree to defend, indemnify and hold harmless Pickle and our affiliates, and our respective officers, directors, employees and agents, from and against any and all claims, damages, obligations, losses, liabilities, costs and expenses (including but not limited to attorney's fees) arising from: (i) your use of, or inability to use, the Services; (ii) your User Submissions; (iii) your interaction with any Services user; or (iv) your violation of these Terms.
            </Paragraph>

            <H2>16. Updates and Upgrades</H2>
            <Paragraph>
                Updates and UpgradesWe may from time to time provide updates or upgrades to the App or Plug-In (each a `Revision`), but are not under any obligation to do so. Such Revisions will be supplied according to our then-current policies, which may include automatic updating or upgrading without any additional notice to you. You consent to any such automatic updating or upgrading of the App or Plug-In. All references herein to the App and Plug-In shall include Revisions thereto. This Agreement shall govern any Revisions that replace or supplement the original App or Plug-In, unless the Revision is accompanied by a separate license agreement which will govern the Revision.
            </Paragraph>

            <H2>17. Third Party Open Source Software</H2>
            <Paragraph>
                Portions of the Services may include third party or open source software that is subject to third party terms and conditions (`Third Party Terms`). Such third party specific license terms and the accompanying copyright notices are located at <a href="https://cdn.streamelements.com/obs/legal/open_source_notice.pdf" target="_blank" className="text-blue-500">https://cdn.streamelements.com/obs/legal/open_source_notice.pdf</a>. We are not responsible for any such software. If there is a conflict between any Third Party Terms and the terms of this Terms, then the Third Party Terms shall prevail but solely in connection with the related third party open source software.
            </Paragraph>

            <H2>18. Term and Termination</H2>
            <Paragraph>
                These Terms are effective until terminated by Pickle or you. Pickle, in its sole discretion, has the right to terminate these Terms and/or your access to the Services, or any part thereof, immediately at any time and with or without cause (including, without any limitation, for a breach of these Terms). Pickle shall not be liable to you or any third party for termination of the Services, or any part thereof. If you object to any term or condition of these Terms, or any subsequent modifications thereto, or become dissatisfied with the Services in any way, your only recourse is to immediately discontinue use of the Services. Upon termination of these Terms, you shall cease all use of the Services. This Section 18 and Sections 8 (Intellectual Property Rights), 9.3 (License to User Submissions), 12 (Privacy), ‎13 (Warranty Disclaimers), ‎14 (Limitation of Liability), ‎15 (Indemnity), and ‎19 (Independent Contractors) to ‎22 (General) shall survive termination of these Terms.
            </Paragraph>

            <H2>19. Independent Contractors</H2>
            <Paragraph>
                You and Pickle are independent contractors. Nothing in these Terms creates a partnership, joint venture, agency, or employment relationship between you and Pickle. You must not under any circumstances make, or undertake, any warranties, representations, commitments or obligations on behalf of Pickle.
            </Paragraph>

            <H2>20. Assignment</H2>
            <Paragraph>
                These Terms, and any rights and licenses granted hereunder, may not be transferred or assigned by you but may be assigned by Pickle without restriction or notification to you. Any prohibited assignment shall be null and void.
            </Paragraph>

            <H2>21. Governing Law</H2>
            <Paragraph>
                Pickle reserves the right to discontinue or modify any aspect of the Services at any time. These Terms and the relationship between you and Pickle shall be governed by and construed in accordance with the laws of the State of New-York, without regard to its principles of conflict of laws. Subject to the foregoing, you agree to submit to the personal and exclusive jurisdiction of the courts located in New-York, USA and waive any jurisdictional, venue, or inconvenient forum objections to such courts, provided that (i) Pickle may seek injunctive relief in any court of competent jurisdiction and (ii) in the event of any dispute relating to Tips processed by Pickle GmbH, such dispute shall be heard in the courts of Germany.
            </Paragraph>

            <H2>22. YouTube</H2>
            <Paragraph>
                Pickle uses the YouTube API. By using Pickle, you are agreeing to be bound by the YouTube <a href="https://www.youtube.com/t/terms" target="_blank" className="text-blue-500">Terms of Service</a>.
            </Paragraph>

            <H2>23. General</H2>
            <Paragraph>
                These Terms shall constitute the entire agreement between you and Pickle concerning the Services. If any provision of these Terms is deemed invalid by a court of competent jurisdiction, the invalidity of such provision shall not affect the validity of the remaining provisions of these Terms, which shall remain in full force and effect. No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term, and a party's failure to assert any right or provision under these Terms shall not constitute a waiver of such right or provision.
                <br />
                YOU AGREE THAT ANY CAUSE OF ACTION THAT YOU MAY HAVE ARISING OUT OF OR RELATED TO THE SERVICES MUST COMMENCE WITHIN ONE (1) YEAR AFTER THE CAUSE OF ACTION ACCRUES. OTHERWISE, SUCH CAUSE OF ACTION IS PERMANENTLY BARRED.
            </Paragraph>

            <Paragraph className="mt-4">
                Last updated: <span className="font-semibold">February, 2025</span>
            </Paragraph>
        </div>
    )
}
