# Crates Public Sharing UI

A beautiful, server-side rendered public sharing interface for Crates music collections. Built with Go, Gin, and Alpine.js for optimal social media unfurling and user experience.

## Features

- **Server-side rendering** with perfect social media meta tags for unfurling
- **Progressive enhancement** with Alpine.js for smooth SPA-like interactions
- **Responsive design** matching the main crates.music aesthetic
- **Profile pages** displaying user's public crates (`/{username}`)
- **Crate pages** with paginated album browsing (`/{username}/{handle}`)
- **Search functionality** with debounced input
- **List/Grid view toggle** with persistent user preference
- **Infinite scroll** for seamless browsing
- **Docker support** for easy deployment

## Routes

- `/{username}` - User profile with public crates
- `/{username}/{handle}` - Individual crate with albums
- `/api/{username}/crates` - JSON API for user's public crates
- `/api/{username}/{handle}/albums` - JSON API for crate albums
- `/health` - Health check endpoint

## Technology Stack

- **Backend**: Go with Gin web framework
- **Frontend**: Server-side rendered HTML + Alpine.js
- **Styling**: Bootstrap 5 with custom CSS matching crates.music design
- **Social**: Open Graph and Twitter Card meta tags
- **Deployment**: Docker containerization

## Development

### Prerequisites
- Go 1.21+
- Running crates-backend service

### Local Development
```bash
# Install dependencies
go mod tidy

# Set environment variables
export BACKEND_URL=http://localhost:8980

# Run the server
go run *.go

# Or build and run
go build -o crates-public
./crates-public
```

### Docker Development
```bash
# Build and run with Docker
docker-compose up --build

# Or build individual image
docker build -t crates-public .
docker run -p 8080:8080 -e BACKEND_URL=http://host.docker.internal:8980 crates-public
```

## Environment Variables

- `PORT` - Server port (default: 8080)
- `BACKEND_URL` - Crates backend API URL (default: http://localhost:8980)
- `GIN_MODE` - Gin framework mode (development/release)

## API Integration

The service proxies to the crates-backend public endpoints:
- `GET /v1/public/user/{username}` - User profile
- `GET /v1/public/user/{username}/crates` - User's public crates
- `GET /v1/public/user/{username}/crate/{handle}` - Specific crate
- `GET /v1/public/user/{username}/crate/{handle}/albums` - Crate albums

## Social Media Optimization

### Open Graph Tags
- `og:title` - Dynamic based on user/crate
- `og:description` - Generated descriptions
- `og:image` - User avatar or first album artwork
- `og:url` - Canonical URL

### Twitter Cards
- Large image cards for rich previews
- Optimized descriptions and titles

## Deployment

The service is designed to be deployed at `share.crates.music` with the following architecture:

```
share.crates.music/{username} → Profile Page
share.crates.music/{username}/{handle} → Crate Page
```

### Production Considerations
- Set `GIN_MODE=release`
- Configure proper `BACKEND_URL`
- Use reverse proxy (nginx/traefik) for HTTPS
- Consider CDN for static assets
- Monitor health check endpoint

## Styling

The UI maintains visual consistency with the main crates.music application:
- **Primary Color**: #1DB954 (Spotify Green)
- **Background**: #000000 (Pure Black)
- **Dark Theme**: Bootstrap 5 dark mode
- **Typography**: System fonts optimized for readability
- **Responsive**: Mobile-first design with Bootstrap breakpoints

## Performance

- Server-side rendering for fast initial loads
- Progressive enhancement for interactive features
- Lazy loading for images
- Infinite scroll for large collections
- Debounced search input
- Efficient API pagination