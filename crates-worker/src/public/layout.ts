// Shared SSR fragments — port of crates-public/templates/base.html + error.html
// and the static legal pages. Class names and DOM structure are kept identical
// so static/css/style.css and static/js/app.js work unchanged.

import { html, raw } from 'hono/html';
import type { HtmlEscapedString } from 'hono/utils/html';

export type Html = HtmlEscapedString | Promise<HtmlEscapedString>;

export interface Meta {
  title: string;
  ogTitle: string;
  ogDesc: string;
  ogImage?: string | null;
  ogURL?: string;
}

/** JSON safe to embed inside a <script> block (escapes `<` against `</script>`). */
export const safeJson = (v: unknown): string => JSON.stringify(v ?? null).replace(/</g, '\\u003c');

/** A JS string literal for embedding server values into inline scripts. */
export const jsStr = (s: string): HtmlEscapedString => raw(safeJson(s));

export const analyticsScripts = html`
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-R9FE82M5C1"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-R9FE82M5C1');
    </script>

    <!-- LogRocket -->
    <script src="https://cdn.lgrckt-in.com/LogRocket.min.js" crossorigin="anonymous"></script>
    <script>window.LogRocket && window.LogRocket.init('a2manf/crates-website');</script>`;

export const stylesheets = html`
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">

    <!-- Custom CSS -->
    <link href="/static/css/style.css" rel="stylesheet">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/static/images/favicon.ico">`;

export const metaTags = (m: Meta) => html`
    <title>${m.title}</title>

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${m.ogTitle}">
    <meta property="og:description" content="${m.ogDesc}">
    <meta property="og:url" content="${m.ogURL ?? 'https://crates.music'}">
    ${m.ogImage ? html`<meta property="og:image" content="${m.ogImage}">` : ''}
    <meta property="og:site_name" content="Crates">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${m.ogTitle}">
    <meta name="twitter:description" content="${m.ogDesc}">
    ${m.ogImage ? html`<meta name="twitter:image" content="${m.ogImage}">` : ''}

    <!-- General meta tags -->
    <meta name="description" content="${m.ogDesc}">
    <meta name="robots" content="index, follow">`;

/** Navbar with the CratesGPT button (base.html / home.html variant). */
export const navbarFull = html`
    <nav class="navbar navbar-expand-lg navbar-dark bg-black border-bottom border-secondary">
        <div class="container-fluid">
            <a class="navbar-brand fw-bold text-white" href="/">
                <img src="/static/images/logo.png" alt="Crates Logo" class="me-2" height="32">crates
            </a>
            <div class="navbar-nav ms-auto d-flex flex-row gap-2">
                <a class="btn btn-outline-secondary btn-sm d-flex align-items-center" href="https://chatgpt.com/g/g-6875a074381c819190d0ef21578ccda9-cratesgpt?utm_source=crates&utm_medium=public_site&utm_campaign=navigation" target="_blank" rel="noopener">
                    <i class="bi-robot me-1"></i><span class="d-none d-lg-inline">CratesGPT</span>
                </a>
                <a class="btn btn-primary cta-button" href="https://app.crates.music" target="_blank">
                    <i class="bi-plus-circle me-1"></i>Organize Your Music
                </a>
            </div>
        </div>
    </nav>`;

/** Navbar without CratesGPT (crate.html / error.html / legal pages variant). */
export const navbarSimple = html`
    <nav class="navbar navbar-expand-lg navbar-dark bg-black border-bottom border-secondary">
        <div class="container-fluid">
            <a class="navbar-brand fw-bold text-white" href="/">
                <img src="/static/images/logo.png" alt="Crates Logo" class="me-2" height="32">crates
            </a>
            <div class="navbar-nav ms-auto">
                <a class="btn btn-primary cta-button" href="https://app.crates.music" target="_blank">
                    <i class="bi-plus-circle me-1"></i>Organize Your Music
                </a>
            </div>
        </div>
    </nav>`;

export const footerCta = html`
    <footer class="footer-cta bg-gradient-dark border-top border-secondary py-3 mt-5">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <p class="mb-0 text-white-50">
                        Crates is a free tool for organizing and sharing your favorite albums. Ready to build your own?
                    </p>
                </div>
                <div class="col-md-4 text-md-end mt-2 mt-md-0">
                    <a href="https://app.crates.music" target="_blank" class="btn btn-primary btn-sm cta-button">
                        Start Now <i class="bi-arrow-right ms-1"></i>
                    </a>
                </div>
            </div>
        </div>
    </footer>`;

export const legalFooter = html`
    <footer class="bg-black border-top border-secondary py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <p class="text-muted mb-0">© 2025 Crates</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <a href="/privacy-policy" class="text-muted text-decoration-none me-3">Privacy Policy</a>
                    <a href="/terms-of-service" class="text-muted text-decoration-none">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>`;

export const bottomScripts = html`
    <!-- Alpine.js -->
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Custom JS -->
    <script src="/static/js/app.js"></script>`;

/** base.html shell: navbar + content + footer CTA + scripts. */
export const baseLayout = (m: Meta, content: Html) => html`<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
${analyticsScripts}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${metaTags(m)}
${stylesheets}
</head>
<body class="bg-black text-white">
${navbarFull}

    <!-- Main Content -->
    <main class="container-fluid p-0">
${content}
    </main>

${footerCta}

${bottomScripts}
</body>
</html>`;

/** error.html — used for 404s and blocked bot traffic. */
export const errorPage = (title: string, message: string) => html`<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
${analyticsScripts}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Crates</title>
${stylesheets}
</head>
<body class="bg-black text-white">
${navbarSimple}

    <!-- Main Content -->
    <main class="container-fluid p-0">
        <div class="container text-center py-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <i class="bi-exclamation-triangle display-1 text-warning mb-4"></i>
                    <h1 class="display-4 text-white mb-3">${title}</h1>
                    <p class="lead text-white-50 mb-4">${message}</p>
                    <div class="d-grid gap-2 d-md-flex justify-content-md-center">
                        <a href="/" class="btn btn-primary">
                            <i class="bi-house me-2"></i>Go Home
                        </a>
                        <button onclick="history.back()" class="btn btn-outline-light">
                            <i class="bi-arrow-left me-2"></i>Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Bootstrap JS only (no Alpine.js or custom JS) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

/** Shell for the static legal pages (standalone layout with legal footer). */
export const legalLayout = (m: Meta, content: Html) => html`<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
${analyticsScripts}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${metaTags(m)}
${stylesheets}
</head>
<body class="bg-black text-white">
${navbarSimple}

    <!-- Main Content -->
    <main class="container-fluid p-0">
        <div class="container py-5">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="card bg-dark border-secondary">
                        <div class="card-body">
${content}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

${legalFooter}

${bottomScripts}
</body>
</html>`;
