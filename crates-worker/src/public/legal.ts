// Static legal pages — ports of privacy-policy.html / terms-of-service.html.

import { html } from 'hono/html';
import { legalLayout } from './layout';

export const privacyPolicyPage = (ogURL: string) =>
  legalLayout(
    {
      title: 'Privacy Policy - Crates',
      ogTitle: 'Privacy Policy - Crates',
      ogDesc: 'Crates Privacy Policy - Learn how we protect your data and respect your privacy.',
      ogURL,
    },
    html`
                            <h1 class="card-title text-white mb-4">Privacy Policy</h1>

                            <div class="text-light">
                                <p><strong>Effective Date:</strong> January 10, 2025</p>

                                <p>Crates ("we", "our", or "us") respects your privacy. This Privacy Policy explains what data we collect, how we use it, and your rights.</p>

                                <h2 class="h4 text-white mt-4 mb-3">1. What We Collect</h2>
                                <p>When you log in with Spotify, we collect:</p>
                                <ul>
                                    <li><strong>Spotify User ID</strong> (your public Spotify username)</li>
                                    <li><strong>Spotify Library Data:</strong> A copy of the albums saved in your Spotify library</li>
                                    <li><strong>Spotify Access Token:</strong> Stored securely and encrypted, used to access the Spotify API on your behalf</li>
                                </ul>
                                <p>We do not collect your email address, playlists, or listening history.</p>

                                <h2 class="h4 text-white mt-4 mb-3">2. How We Use Your Data</h2>
                                <p>We use your Spotify data to:</p>
                                <ul>
                                    <li>Display your saved albums</li>
                                    <li>Let you organize them into "crates"</li>
                                    <li>Power your public profile and shared crates (if you choose to make them public)</li>
                                </ul>
                                <p>We may also use aggregated, non-identifiable usage data to help improve the service.</p>

                                <p>We do not:</p>
                                <ul>
                                    <li>Sell or share your personal data with third parties</li>
                                    <li>Use your Spotify data for advertising</li>
                                </ul>

                                <h2 class="h4 text-white mt-4 mb-3">3. Analytics and Cookies</h2>
                                <p>We may use analytics tools like Google Analytics to understand how users interact with Crates (e.g., which pages are visited, how long users stay). This data is collected in aggregate and cannot identify individual users.</p>

                                <p>Cookies or local storage may be used to:</p>
                                <ul>
                                    <li>Keep you logged in</li>
                                    <li>Store app preferences</li>
                                </ul>
                                <p>You can disable cookies in your browser settings if you prefer not to be tracked.</p>

                                <h2 class="h4 text-white mt-4 mb-3">4. Data Security</h2>
                                <ul>
                                    <li>Spotify tokens are encrypted</li>
                                    <li>Personal data is protected using industry-standard practices</li>
                                    <li>No Spotify credentials (e.g., password) are ever accessed or stored</li>
                                </ul>

                                <h2 class="h4 text-white mt-4 mb-3">5. Your Rights</h2>
                                <ul>
                                    <li>You can revoke Crates' access from your Spotify connected apps</li>
                                    <li>You can contact us to request deletion of your data</li>
                                </ul>

                                <h2 class="h4 text-white mt-4 mb-3">6. Changes to This Policy</h2>
                                <p>We may update this policy in the future. Any material changes will be posted here with an updated "Effective Date."</p>
                            </div>`,
  );

export const termsOfServicePage = (ogURL: string) =>
  legalLayout(
    {
      title: 'Terms of Service - Crates',
      ogTitle: 'Terms of Service - Crates',
      ogDesc: 'Crates Terms of Service - Review the terms and conditions for using our service.',
      ogURL,
    },
    html`
                            <h1 class="card-title text-white mb-4">📄 Crates – Terms of Service</h1>

                            <div class="text-light">
                                <p><strong>Effective Date:</strong> January 10, 2025</p>

                                <p>Welcome to Crates! These Terms of Service ("Terms") govern your access to and use of the Crates website and services (collectively, "Crates", "we", "us", or "our").</p>

                                <p>By accessing or using Crates, you agree to be bound by these Terms. If you do not agree, please do not use the service.</p>

                                <h2 class="h4 text-white mt-4 mb-3">1. About Crates</h2>
                                <p>Crates is a web application that helps you organize, categorize, and share your Spotify album library by creating "crates." It is operated by an individual creator and is not affiliated with or endorsed by Spotify.</p>

                                <h2 class="h4 text-white mt-4 mb-3">2. Eligibility</h2>
                                <p>You must:</p>
                                <ul>
                                    <li>Be at least 13 years old</li>
                                    <li>Log in using your own Spotify account</li>
                                    <li>Comply with Spotify's Terms of Use</li>
                                </ul>

                                <h2 class="h4 text-white mt-4 mb-3">3. User Content and Permissions</h2>
                                <p>When you create crates or interact with your album library on Crates, you're generating content ("User Content").</p>

                                <p>You retain all rights to your User Content, but you grant Crates a limited, non-exclusive license to display it as part of the service — including on public profiles, shared crate pages, or in discovery sections — if you choose to make your content public.</p>

                                <p>You are solely responsible for the content you create and share.</p>

                                <h2 class="h4 text-white mt-4 mb-3">4. Acceptable Use</h2>
                                <p>You agree not to:</p>
                                <ul>
                                    <li>Use Crates for unlawful, harmful, or abusive purposes</li>
                                    <li>Interfere with or disrupt the functionality of the site</li>
                                    <li>Attempt to access or reverse-engineer areas of the system you're not authorized to use</li>
                                    <li>Upload or link to malicious or deceptive content</li>
                                </ul>

                                <h2 class="h4 text-white mt-4 mb-3">5. Account Disconnection and Termination</h2>
                                <p>You may revoke Crates' access at any time by removing it from your connected apps in your Spotify settings.</p>

                                <p>We reserve the right to suspend or terminate access to Crates for any user who violates these Terms or misuses the platform.</p>

                                <h2 class="h4 text-white mt-4 mb-3">6. Disclaimers</h2>
                                <p>Crates is provided "as is" without warranties of any kind, either express or implied. We do not guarantee uninterrupted access or that the service will be error-free or secure.</p>

                                <p>Spotify's service or API availability may impact Crates functionality, and we are not responsible for changes made by Spotify that affect your experience.</p>

                                <h2 class="h4 text-white mt-4 mb-3">7. Limitation of Liability</h2>
                                <p>To the maximum extent permitted by law, Crates (and its creator) will not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>

                                <p>You use Crates at your own risk.</p>

                                <h2 class="h4 text-white mt-4 mb-3">8. Privacy</h2>
                                <p>Our Privacy Policy explains what information we collect and how we use it. By using Crates, you agree to the terms of our Privacy Policy.</p>

                                <h2 class="h4 text-white mt-4 mb-3">9. Changes to These Terms</h2>
                                <p>We may update these Terms from time to time. When we do, we'll update the "Effective Date" and, if changes are material, we'll provide notice on the site.</p>

                                <p>Your continued use of Crates after changes means you accept the updated Terms.</p>
                            </div>`,
  );
