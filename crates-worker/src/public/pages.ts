// SSR pages — ports of crates-public/templates/{home,profile,crate}.html.
// Client-side Alpine.js code is kept byte-for-byte where possible; `\${` in
// inline scripts is client-side template-literal interpolation, `${` is
// server-side.

import { html, raw } from 'hono/html';
import type { CrateAlbumDto, CrateDto } from '../lib/dto';
import { baseLayout, jsStr, navbarSimple, footerCta, analyticsScripts, metaTags, stylesheets, safeJson, type Meta } from './layout';

const formatDateShort = (isoDate: string | null): string =>
  isoDate
    ? new Date(isoDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

// ---------- home ----------

export interface FeaturedCrate {
  id: number;
  name: string;
  handle: string;
  ownerName: string;
  ownerSpotifyId: string;
  imageUri: string | null;
  createdAt: string | null;
}

export const homePage = (featuredCrates: FeaturedCrate[]) => {
  const meta: Meta = {
    title: 'Crates - Organize Your Spotify Albums',
    ogTitle: 'Crates - Organize Your Spotify Albums',
    ogDesc:
      'Organize your Spotify albums into custom categories, discover curated collections from other music lovers, and rediscover the joy of full albums.',
    ogImage: 'https://crates.music/static/images/crates-card.png',
    ogURL: 'https://crates.music',
  };
  return html`<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
${analyticsScripts}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${metaTags(meta)}
${stylesheets}
</head>
<body class="bg-black text-white home-page">
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
    </nav>

    <!-- Main Content -->
    <main class="container-fluid p-0">
        <div x-data="homeApp(${safeJson(featuredCrates)})" x-init="init()">
            <!-- Hero Section -->
            <section class="hero-section bg-gradient-dark py-5">
                <div class="container">
                    <div class="row align-items-center min-vh-75">
                        <div class="col-lg-6">
                            <div class="hero-content text-center text-lg-start">
                                <img src="/static/images/logo.png" alt="Crates Logo" class="hero-logo mb-4 d-block d-lg-none mx-auto" width="80">
                                <h1 class="display-2 fw-bold text-white mb-4">
                                    Playlists are for songs,<br>
                                    <span class="text-primary">Crates</span> are for <span class="text-primary">albums</span>.
                                </h1>
                                <p class="lead text-white-50 mb-5">
                                    Organize your Spotify albums into custom categories, discover curated collections from other music lovers, and rediscover the joy of full albums curated just the way you like.
                                </p>
                                <div class="hero-actions d-flex flex-column gap-3 justify-content-center justify-content-lg-start">
                                    <a href="https://app.crates.music" class="btn btn-primary btn-lg px-4 py-3">
                                        <i class="bi-music-note-beamed me-2"></i>Start Organizing
                                    </a>
                                    <a href="https://chatgpt.com/g/g-6875a074381c819190d0ef21578ccda9-cratesgpt?utm_source=crates&utm_medium=public_site&utm_campaign=hero_section" target="_blank" rel="noopener" class="btn btn-outline-primary btn-lg px-4 py-3">
                                        <i class="bi-robot me-2"></i>Try with AI
                                    </a>
                                    <button @click="scrollToExplore()" class="btn btn-outline-light btn-lg px-4 py-3">
                                        <i class="bi-search me-2"></i>Browse Public Crates
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="hero-visual text-center d-none d-lg-block">
                                <img src="/static/images/logo.png" alt="Crates Logo" class="hero-logo-large" width="200">
                                <div class="hero-illustration mt-4">
                                    <div class="floating-crates">
                                        <div class="crate-card-demo">
                                            <div class="demo-album bg-primary"></div>
                                            <div class="demo-info">
                                                <div class="demo-title"></div>
                                                <div class="demo-artist"></div>
                                            </div>
                                        </div>
                                        <div class="crate-card-demo">
                                            <div class="demo-album bg-success"></div>
                                            <div class="demo-info">
                                                <div class="demo-title"></div>
                                                <div class="demo-artist"></div>
                                            </div>
                                        </div>
                                        <div class="crate-card-demo">
                                            <div class="demo-album bg-warning"></div>
                                            <div class="demo-info">
                                                <div class="demo-title"></div>
                                                <div class="demo-artist"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Features Section -->
            <section class="features-section py-5 bg-dark">
                <div class="container">
                    <div class="row text-center mb-5">
                        <div class="col">
                            <h2 class="display-5 fw-bold text-white mb-3">Why Choose Albums Over Singles?</h2>
                            <p class="lead text-white-50">Experience music the way artists intended - as complete, cohesive works of art.</p>
                        </div>
                    </div>

                    <!-- Auto-Categorization Highlight -->
                    <div class="row mb-5">
                        <div class="col-lg-10 mx-auto">
                            <div class="feature-card-highlight text-center p-4 p-md-5">
                                <div class="feature-icon mb-3">
                                    <i class="bi-magic display-3 text-primary"></i>
                                </div>
                                <h3 class="text-white mb-3">One-Click Auto-Categorization</h3>
                                <p class="text-white-50 lead mb-4">
                                    Don't want to organize manually? No problem. Hit one button and we'll automatically
                                    sort your entire library into smart crates based on genre, decade, and more.
                                </p>
                                <a href="https://app.crates.music" class="btn btn-primary btn-lg">
                                    <i class="bi-magic me-2"></i>Try Auto-Categorize
                                </a>
                            </div>
                        </div>
                    </div>

                    <div class="row g-4">
                        <div class="col-md-6 col-lg-3">
                            <div class="feature-card text-center h-100 p-4">
                                <div class="feature-icon mb-3">
                                    <i class="bi-collection display-4 text-primary"></i>
                                </div>
                                <h4 class="text-white mb-3">Organize Your Albums</h4>
                                <p class="text-white-50">Create custom crates to organize your albums by genre, mood, era, or any way that makes sense to you.</p>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-3">
                            <div class="feature-card text-center h-100 p-4">
                                <div class="feature-icon mb-3">
                                    <i class="bi-robot display-4 text-primary"></i>
                                </div>
                                <h4 class="text-white mb-3">AI-Powered Creation</h4>
                                <p class="text-white-50">Let CratesGPT analyze your taste and intelligently create themed collections based on your listening habits.</p>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-3">
                            <div class="feature-card text-center h-100 p-4">
                                <div class="feature-icon mb-3">
                                    <i class="bi-share display-4 text-primary"></i>
                                </div>
                                <h4 class="text-white mb-3">Share Your Taste</h4>
                                <p class="text-white-50">Make your crates public and share your curated music collections with friends and fellow music lovers.</p>
                            </div>
                        </div>
                        <div class="col-md-6 col-lg-3">
                            <div class="feature-card text-center h-100 p-4">
                                <div class="feature-icon mb-3">
                                    <i class="bi-lightning display-4 text-primary"></i>
                                </div>
                                <h4 class="text-white mb-3">Sync with Spotify</h4>
                                <p class="text-white-50">Automatically sync your saved albums from Spotify and keep everything organized in one place.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Explore Section -->
            <section id="explore" class="explore-section py-5 bg-darker">
                <div class="container">
                    <div class="row text-center mb-5">
                        <div class="col">
                            <h2 class="display-5 fw-bold text-white mb-3">Discover Public Crates</h2>
                            <p class="lead text-white-50">Explore curated album collections from music enthusiasts around the world.</p>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div x-show="loading" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>

                    <!-- Featured Crates Grid -->
                    <div x-show="!loading" class="row g-4">
                        <template x-for="crate in featuredCrates" :key="crate.id">
                            <div class="col-md-6 col-lg-4">
                                <div class="crate-preview-card card bg-card border-secondary h-100 position-relative overflow-hidden">
                                    <div class="crate-image-container">
                                        <img :src="crate.imageUri || '/static/images/album-placeholder.svg'"
                                             :alt="crate.name"
                                             class="crate-image"
                                             onerror="this.src='/static/images/album-placeholder.svg'">
                                        <div class="card-img-overlay d-flex align-items-end p-0">
                                            <div class="w-100 bg-gradient-overlay p-3">
                                                <h5 class="card-title text-white mb-1 fw-bold" x-text="crate.name"></h5>
                                                <p class="card-text text-white-50 small mb-0">
                                                    by <span x-text="crate.ownerName"></span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <a :href="'/' + crate.ownerSpotifyId + '/' + crate.handle" class="stretched-link"></a>
                                </div>
                            </div>
                        </template>
                    </div>

                    <!-- Empty State -->
                    <div x-show="!loading && featuredCrates.length === 0" class="text-center py-5">
                        <i class="bi-vinyl display-1 text-muted"></i>
                        <h3 class="mt-3 text-muted">No public crates yet</h3>
                        <p class="text-muted">Be the first to create and share your music collection!</p>
                        <a href="https://app.crates.music" class="btn btn-primary mt-3">
                            <i class="bi-plus-circle me-2"></i>Create Your First Crate
                        </a>
                    </div>

                    <!-- Browse All -->
                    <div x-show="!loading && featuredCrates.length > 0" class="text-center mt-5">
                        <p class="text-white-50 mb-3">Want to see more curated collections?</p>
                        <a href="https://app.crates.music" class="btn btn-outline-primary btn-lg">
                            <i class="bi-arrow-right-circle me-2"></i>Start Your Own Collection
                        </a>
                    </div>
                </div>
            </section>

            <!-- CTA Section -->
            <section class="cta-section py-5 bg-gradient-primary">
                <div class="container">
                    <div class="row text-center">
                        <div class="col-lg-8 mx-auto">
                            <h2 class="display-5 fw-bold text-white mb-3">Ready to Organize Your Music?</h2>
                            <p class="lead text-white mb-4">
                                Join thousands of music lovers who have discovered the joy of album-based organization.
                                Connect your Spotify account and start curating your perfect music collection today.
                            </p>
                            <a href="https://app.crates.music" class="btn btn-light btn-lg px-5 py-3">
                                <i class="bi-spotify me-2"></i>Get Started with Spotify
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div class="bg-black py-4">
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
                </div>
            </section>
        </div>
    </main>

    <!-- Alpine.js -->
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Custom JS -->
    <script src="/static/js/app.js"></script>

    <style>
    /* Remove body padding on home page since no sticky footer */
    body {
        padding-bottom: 0 !important;
    }
    </style>

    <script>
    function homeApp(featuredCrates) {
        return {
            featuredCrates: featuredCrates || [],
            loading: false,

            init() {
                console.log('Home app initialized with', this.featuredCrates.length, 'featured crates');
            },

            scrollToExplore() {
                document.getElementById('explore').scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    }
    </script>

    <style>
    .min-vh-75 { min-height: 75vh; }
    .hero-logo { filter: drop-shadow(0 4px 20px rgba(29, 185, 84, 0.3)); }
    .hero-logo-large { filter: drop-shadow(0 8px 40px rgba(29, 185, 84, 0.4)); }
    .floating-crates { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .crate-card-demo {
        background: var(--bg-card);
        border-radius: var(--radius-md);
        padding: 1rem;
        width: 120px;
        animation: float 3s ease-in-out infinite;
        border: 1px solid var(--border-subtle);
    }
    .crate-card-demo:nth-child(2) { animation-delay: -1s; }
    .crate-card-demo:nth-child(3) { animation-delay: -2s; }
    .demo-album { width: 100%; height: 80px; border-radius: var(--radius-sm); margin-bottom: 0.5rem; }
    .demo-info { text-align: left; }
    .demo-title { height: 12px; background: var(--text-white); border-radius: 2px; margin-bottom: 0.25rem; width: 80%; }
    .demo-artist { height: 8px; background: var(--text-muted); border-radius: 2px; width: 60%; }
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    }
    .feature-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
        transition: var(--transition);
    }
    .feature-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--primary); }
    .feature-card-highlight {
        background: linear-gradient(135deg, rgba(29, 185, 84, 0.1) 0%, rgba(29, 185, 84, 0.05) 100%);
        border-radius: var(--radius-lg);
        border: 2px solid var(--primary);
        transition: var(--transition);
    }
    .feature-card-highlight:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(29, 185, 84, 0.3); }
    .crate-preview-card { transition: var(--transition); }
    .crate-preview-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .bg-gradient-dark { background: linear-gradient(135deg, var(--bg-darker) 0%, var(--bg-dark) 100%); }
    .bg-gradient-primary { background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%); }
    .bg-gradient-overlay { background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%); }
    .bg-card { background-color: var(--bg-card) !important; }
    .bg-darker { background-color: var(--bg-darker) !important; }
    </style>
</body>
</html>`;
};

// ---------- profile ----------

export interface ProfilePageData {
  user: ReturnType<typeof import('../lib/dto').userDto>;
  crates: CrateDto[];
  hasMoreCrates: boolean;
  ogURL: string;
}

export const profilePage = ({ user, crates, hasMoreCrates, ogURL }: ProfilePageData) => {
  const identifier = user.handle || user.spotifyId;
  const avatar = user.images[0]?.url ?? null;
  const meta: Meta = {
    title: `${user.displayName} - Crates`,
    ogTitle: `${user.displayName} - Crates`,
    ogDesc: `Check out ${user.displayName}'s music crates`,
    ogImage: avatar,
    ogURL,
  };
  const content = html`
<div x-data="profileApp()" x-init="init()">
    <!-- User Profile Header -->
    <div class="profile-header bg-gradient-dark p-4">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-auto">
                    ${
                      avatar
                        ? html`<img src="${avatar}" alt="${user.displayName}" class="profile-avatar rounded-circle">`
                        : html`<div class="profile-avatar bg-secondary rounded-circle d-flex align-items-center justify-content-center">
                            <i class="bi-person-fill fs-1"></i>
                        </div>`
                    }
                </div>
                <div class="col">
                    <div class="mb-2">
                        <span class="display-4 text-primary d-none d-md-block">@${identifier}</span>
                        <span class="h2 text-primary d-md-none">@${identifier}</span>
                        <button type="button"
                                class="btn btn-link text-white p-1 share-btn"
                                @click="shareProfile()"
                                title="Share Profile">
                            <i class="bi-share"></i>
                        </button>
                    </div>
                    ${user.bio ? html`<p class="mb-2 text-light">${user.bio}</p>` : ''}
                    <div class="d-flex align-items-center justify-content-between flex-wrap mb-sm-3">
                        <div class="d-flex align-items-center gap-3 flex-wrap">
                            <p class="lead mb-0 text-white-50">
                                <span x-text="crates.length"></span> public crates
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Search and Filter Controls -->
    <div class="container pb-sm-2 pb-4 pt-3">
        <div class="d-flex align-items-center gap-3">
            <div class="flex-grow-1">
                <div class="input-group">
                    <span class="input-group-text bg-dark border-secondary">
                        <i class="bi-search"></i>
                    </span>
                    <input type="text"
                           class="form-control bg-dark border-secondary text-white mb-1"
                           placeholder="Search crates..."
                           x-model="searchTerm"
                           @input.debounce.500ms="searchCrates()"
                           @keyup.escape="clearSearch()">
                    <button class="btn btn-outline-secondary"
                            type="button"
                            x-show="searchTerm"
                            @click="clearSearch()">
                        <i class="bi-x"></i>
                    </button>
                </div>
            </div>
            <div class="view-toggle-compact">
                <div class="btn-group" role="group">
                    <button type="button"
                            class="btn btn-outline-primary btn-sm"
                            :class="{'active': viewMode === 'grid'}"
                            @click="setViewMode('grid')"
                            title="Grid View">
                        <i class="bi-grid-3x3-gap"></i>
                    </button>
                    <button type="button"
                            class="btn btn-outline-primary btn-sm"
                            :class="{'active': viewMode === 'list'}"
                            @click="setViewMode('list')"
                            title="List View">
                        <i class="bi-list"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Crates Grid -->
    <div class="container pb-5">
        <!-- Loading State -->
        <div x-show="loading && crates.length === 0" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <!-- No Results -->
        <div x-show="!loading && crates.length === 0" class="text-center py-5">
            <i class="bi-vinyl display-1 text-muted"></i>
            <h3 class="mt-3 text-muted">No crates found</h3>
            <p class="text-muted">
                <span x-show="searchTerm">Try adjusting your search terms.</span>
                <span x-show="!searchTerm">This user hasn't created any public crates yet.</span>
            </p>
        </div>

        <!-- Grid View -->
        <div x-show="viewMode === 'grid'"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             class="row g-4">
            <template x-for="(crate, index) in crates" :key="crate.id">
                <div class="col-6 col-md-4 col-lg-3"
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0 transform translate-y-4"
                     x-transition:enter-end="opacity-100 transform translate-y-0"
                     :style="\`transition-delay: \${index * 50}ms\`">
                    <div class="crate-card card bg-dark border-secondary h-100 position-relative overflow-hidden">
                        <div class="crate-image-container">
                            <img :src="crate.imageUri || '/static/images/album-placeholder.svg'"
                                 :alt="crate.name"
                                 class="card-img-top crate-image"
                                 onerror="this.src='/static/images/album-placeholder.svg'">
                            <div class="card-img-overlay d-flex align-items-end p-0">
                                <div class="w-100 bg-gradient-overlay p-3">
                                    <h5 class="card-title text-white mb-1 fw-bold" x-text="crate.name"></h5>
                                    <p class="card-text text-white-50 small mb-0">
                                        <span x-text="formatDate(crate.createdAt)"></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <a :href="getCrateUrl(crate)"
                           class="stretched-link"></a>
                    </div>
                </div>
            </template>
        </div>

        <!-- List View -->
        <div x-show="viewMode === 'list'" class="list-group list-group-flush">
            <template x-for="crate in crates" :key="crate.id">
                <a :href="getCrateUrl(crate)"
                   class="list-group-item list-group-item-action bg-dark border-secondary text-white d-flex align-items-center p-3">
                    <div class="flex-shrink-0 me-3">
                        <img :src="crate.imageUri || '/static/images/album-placeholder.svg'"
                             :alt="crate.name"
                             class="crate-thumbnail rounded"
                             onerror="this.src='/static/images/album-placeholder.svg'">
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1 text-primary fw-bold" x-text="crate.name"></h6>
                        <p class="mb-0 text-white-50 small">
                            <span x-text="formatDate(crate.createdAt)"></span>
                        </p>
                    </div>
                    <div class="flex-shrink-0">
                        <i class="bi-chevron-right text-muted"></i>
                    </div>
                </a>
            </template>
        </div>

        <!-- Load More -->
        <div class="text-center mt-4" x-show="hasMore && !loading">
            <button class="btn btn-outline-primary" @click="loadMore()">
                <i class="bi-arrow-clockwise me-2"></i>Load More
            </button>
        </div>

        <!-- Loading More -->
        <div class="text-center mt-4" x-show="loading && crates.length > 0">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">Loading more...</span>
            </div>
        </div>
    </div>

    <!-- Intersection Observer Target -->
    <div x-ref="loadMoreTrigger" x-show="hasMore" class="load-more-trigger"></div>
</div>

<script>
function profileApp() {
    return {
        // Data from backend
        crates: ${raw(safeJson(crates))},
        hasMore: ${hasMoreCrates},

        // UI state
        loading: false,
        searchTerm: '',
        viewMode: localStorage.getItem('viewMode') || 'grid',
        currentPage: 0,

        init() {
            this.setupIntersectionObserver();
        },

        setupIntersectionObserver() {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && this.hasMore && !this.loading) {
                    this.loadMore();
                }
            }, { threshold: 0.1 });

            if (this.$refs.loadMoreTrigger) {
                observer.observe(this.$refs.loadMoreTrigger);
            }
        },

        setViewMode(mode) {
            this.viewMode = mode;
            localStorage.setItem('viewMode', mode);
        },

        getCrateUrl(crate) {
            const userIdentifier = ${jsStr(identifier)};
            return \`/\${userIdentifier}/\${crate.handle}\`;
        },

        async searchCrates() {
            this.loading = true;

            try {
                const response = await fetch(\`/api/${user.spotifyId}/crates?search=\${encodeURIComponent(this.searchTerm)}&page=0&size=12\`);
                const data = await response.json();
                this.crates = data.content || [];
                this.hasMore = !data.last;
                this.currentPage = 0;
            } catch (error) {
                console.error('Error searching:', error);
            } finally {
                this.loading = false;
            }
        },

        clearSearch() {
            this.searchTerm = '';
            this.searchCrates();
        },

        async loadMore() {
            if (this.loading || !this.hasMore) return;

            this.loading = true;
            const nextPage = ++this.currentPage;

            try {
                const response = await fetch(\`/api/${user.spotifyId}/crates?search=\${encodeURIComponent(this.searchTerm)}&page=\${nextPage}&size=12\`);
                const data = await response.json();
                this.crates = [...this.crates, ...(data.content || [])];
                this.hasMore = !data.last;
            } catch (error) {
                console.error('Error loading more:', error);
                this.currentPage--;
            } finally {
                this.loading = false;
            }
        },

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        shareProfile() {
            const username = ${jsStr(identifier)};
            const url = window.location.href;
            const title = \`Check out @\${username}'s music crates\`;
            const text = \`Discover \${username}'s curated music collection on Crates\`;

            shareUrl(url, title, text);
        }
    }
}
</script>`;
  return baseLayout(meta, content);
};

// ---------- crate ----------

export interface CratePageData {
  user: ReturnType<typeof import('../lib/dto').userDto>;
  crate: CrateDto;
  albums: CrateAlbumDto[];
  hasMore: boolean;
  totalAlbums: number;
  ogURL: string;
}

export const cratePage = ({ user, crate, albums, hasMore, totalAlbums, ogURL }: CratePageData) => {
  const identifier = user.handle || user.spotifyId;
  const firstAlbumImage = albums[0]?.album.images[0]?.url ?? null;
  const meta: Meta = {
    title: `${crate.name} by ${user.displayName}`,
    ogTitle: `${crate.name} by ${user.displayName}`,
    ogDesc: `A music crate with ${totalAlbums} albums`,
    ogImage: firstAlbumImage,
    ogURL,
  };
  return html`<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
${analyticsScripts}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${metaTags(meta)}
${stylesheets}
</head>
<body class="bg-black text-white">
${navbarSimple}

    <!-- Main Content -->
    <main class="container-fluid p-0">
<div x-data="crateApp()" x-init="init()">
    <!-- Crate Header -->
    <div class="crate-header bg-gradient-dark pt-sm-2 pt-1">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-auto">
                    <a href="/${user.spotifyId}" class="btn btn-outline-light btn-sm">
                        <i class="bi-arrow-left me-1"></i>Back to Profile
                    </a>
                </div>
            </div>
            <div class="row align-items-center mt-sm-3">
                <div class="col-auto">
                    ${
                      crate.imageUri
                        ? html`<img src="${crate.imageUri}" alt="${crate.name}" class="crate-cover rounded">`
                        : html`<div class="crate-cover bg-gradient-primary d-flex align-items-center justify-content-center rounded">
                            <i class="bi-vinyl-fill display-3 text-white"></i>
                        </div>`
                    }
                </div>
                <div class="col">
                    <div class="mb-2">
                        <span class="display-4 text-primary d-none d-md-block">${crate.name}</span>
                        <span class="h2 text-primary d-md-none">${crate.name}</span>
                        <button type="button"
                                class="btn btn-link text-white p-1 share-btn"
                                @click="shareCrate()"
                                title="Share Crate">
                            <i class="bi-share"></i>
                        </button>
                    </div>
                    ${crate.description ? html`<p class="text-white-50 mb-3">${crate.description}</p>` : ''}
                    <p class="lead mb-2">
                        by <a href="/${identifier}" class="text-white text-decoration-none fw-bold">${user.displayName}</a>
                    </p>
                    <div class="d-flex align-items-center justify-content-between flex-wrap">
                        <p class="text-white-50 mb-0">
                            <span x-text="stats.totalAlbums"></span> albums
                            <span class="mx-2">•</span>
                            ${formatDateShort(crate.createdAt)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Controls -->
    <div class="container pb-4">
        <div class="row align-items-center">
            <div class="col-md-8">
                <div class="input-group">
                    <span class="input-group-text bg-dark border-secondary">
                        <i class="bi-search"></i>
                    </span>
                    <input type="text"
                           class="form-control bg-dark border-secondary text-white mb-1"
                           placeholder="Search albums..."
                           x-model="searchTerm"
                           @input.debounce.500ms="searchAlbums()"
                           @keyup.escape="clearSearch()">
                    <button class="btn btn-outline-secondary"
                            type="button"
                            x-show="searchTerm"
                            @click="clearSearch()">
                        <i class="bi-x"></i>
                    </button>
                </div>
            </div>
            <div class="col-md-4">
                <div class="btn-group w-100" role="group">
                    <button type="button"
                            class="btn btn-outline-primary"
                            :class="{'active': viewMode === 'grid'}"
                            @click="setViewMode('grid')">
                        <i class="bi-grid-3x3-gap"></i>
                    </button>
                    <button type="button"
                            class="btn btn-outline-primary"
                            :class="{'active': viewMode === 'list'}"
                            @click="setViewMode('list')">
                        <i class="bi-list"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Albums -->
    <div class="container pb-5">
        <!-- Loading State -->
        <div x-show="loading && albums.length === 0" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <!-- No Results -->
        <div x-show="!loading && albums.length === 0" class="text-center py-5">
            <i class="bi-disc display-1 text-muted"></i>
            <h3 class="mt-3 text-muted">No albums found</h3>
            <p class="text-muted">
                <span x-show="searchTerm">Try adjusting your search terms.</span>
                <span x-show="!searchTerm">This crate is empty.</span>
            </p>
        </div>

        <!-- Grid View -->
        <div x-show="viewMode === 'grid'" class="row g-4">
            <template x-for="album in albums" :key="album.id">
                <div class="col-6 col-md-4 col-lg-3">
                    <div class="album-card card bg-dark border-secondary h-100 position-relative overflow-hidden">
                        <div class="album-image-container">
                            <img :src="getAlbumImage(album.album)"
                                 :alt="album.album.name"
                                 class="card-img-top album-image"
                                 onerror="this.src='/static/images/album-placeholder.svg'">
                            <div class="card-img-overlay d-flex align-items-end p-0">
                                <div class="w-100 bg-gradient-overlay p-3">
                                    <h6 class="card-title text-white mb-1 fw-bold" x-text="album.album.name"></h6>
                                    <p class="card-text text-white-50 small mb-0" x-text="getArtistNames(album.album)"></p>
                                </div>
                            </div>
                        </div>
                        <a :href="'https://open.spotify.com/album/' + album.album.spotifyId"
                           target="_blank"
                           class="stretched-link"
                           rel="noopener noreferrer"></a>
                    </div>
                </div>
            </template>
        </div>

        <!-- List View -->
        <div x-show="viewMode === 'list'" class="list-group list-group-flush">
            <template x-for="album in albums" :key="album.id">
                <a :href="'https://open.spotify.com/album/' + album.album.spotifyId"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="list-group-item list-group-item-action bg-dark border-secondary text-white d-flex align-items-center p-3">
                    <div class="flex-shrink-0 me-3">
                        <img :src="getAlbumImage(album.album)"
                             :alt="album.album.name"
                             class="album-thumbnail rounded"
                             onerror="this.src='/static/images/album-placeholder.svg'">
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1 text-primary fw-bold" x-text="album.album.name"></h6>
                        <p class="mb-1 text-white" x-text="getArtistNames(album.album)"></p>
                        <p class="mb-0 text-white-50 small">
                            <span x-text="formatDate(album.album.releaseDate)"></span>
                            <span class="mx-2">•</span>
                            Added <span x-text="formatDate(album.createdAt)"></span>
                        </p>
                    </div>
                    <div class="flex-shrink-0">
                        <i class="bi-music-note-beamed text-primary opacity-75"></i>
                    </div>
                </a>
            </template>
        </div>

        <!-- Load More -->
        <div class="text-center mt-4" x-show="hasMore && !loading">
            <button class="btn btn-outline-primary" @click="loadMore()">
                <i class="bi-arrow-clockwise me-2"></i>Load More
            </button>
        </div>

        <!-- Loading More -->
        <div class="text-center mt-4" x-show="loading && albums.length > 0">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">Loading more...</span>
            </div>
        </div>
    </div>

    <!-- Intersection Observer Target -->
    <div x-ref="loadMoreTrigger" x-show="hasMore" class="load-more-trigger"></div>
</div>

${footerCta}

<script>
function crateApp() {
    return {
        albums: ${raw(safeJson(albums))} || [],
        hasMore: ${hasMore},
        loading: false,
        searchTerm: '',
        viewMode: localStorage.getItem('viewMode') || 'grid',
        currentPage: 0,
        stats: {
            totalAlbums: ${totalAlbums}
        },

        init() {
            this.setupIntersectionObserver();
        },

        setupIntersectionObserver() {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && this.hasMore && !this.loading) {
                    this.loadMore();
                }
            }, { threshold: 0.1 });

            if (this.$refs.loadMoreTrigger) {
                observer.observe(this.$refs.loadMoreTrigger);
            }
        },

        setViewMode(mode) {
            this.viewMode = mode;
            localStorage.setItem('viewMode', mode);
        },

        async searchAlbums() {
            this.loading = true;
            this.currentPage = 0;

            try {
                const response = await fetch(\`/api/${user.spotifyId}/${crate.handle}/albums?search=\${encodeURIComponent(this.searchTerm)}&page=0&size=20\`);
                const data = await response.json();
                this.albums = data.content || [];
                this.hasMore = !data.last;
            } catch (error) {
                console.error('Error searching albums:', error);
            } finally {
                this.loading = false;
            }
        },

        clearSearch() {
            this.searchTerm = '';
            this.searchAlbums();
        },

        async loadMore() {
            if (this.loading || !this.hasMore) return;

            this.loading = true;
            const nextPage = this.currentPage + 1;

            try {
                const response = await fetch(\`/api/${user.spotifyId}/${crate.handle}/albums?search=\${encodeURIComponent(this.searchTerm)}&page=\${nextPage}&size=20\`);
                const data = await response.json();
                this.albums = [...this.albums, ...(data.content || [])];
                this.hasMore = !data.last;
                this.currentPage = nextPage;
            } catch (error) {
                console.error('Error loading more albums:', error);
            } finally {
                this.loading = false;
            }
        },

        getAlbumImage(album) {
            if (album.images && album.images.length > 0) {
                // Find the largest image by area (width * height)
                const largestImage = album.images.reduce((largest, current) => {
                    const largestArea = (largest.width || 0) * (largest.height || 0);
                    const currentArea = (current.width || 0) * (current.height || 0);
                    return currentArea > largestArea ? current : largest;
                });
                return largestImage.url;
            }
            return '/static/images/album-placeholder.svg';
        },

        getArtistNames(album) {
            if (album.artists && album.artists.length > 0) {
                return album.artists.map(artist => artist.name).join(', ');
            }
            return 'Unknown Artist';
        },

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        shareCrate() {
            const username = ${jsStr(identifier)};
            const crateName = ${jsStr(crate.name)};
            const url = window.location.href;
            const title = \`\${crateName} by @\${username}\`;
            const text = \`Check out this curated music collection on Crates\`;

            shareUrl(url, title, text);
        }
    }
}
</script>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<!-- App JS -->
<script src="/static/js/app.js"></script>
<!-- Alpine.js -->
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>

</main>
</body>
</html>`;
};
