# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crates is a comprehensive music organization and sharing platform that allows users to organize their Spotify library albums into custom categories called "crates" and share them publicly. The application consists of a Spring Boot backend, Angular frontend, Go-based public sharing service, and PostgreSQL database.

**Live Version:** https://app.crates.page  
**Public Sharing:** https://crates.page

## Architecture

**Backend (crates-backend/):**
- Spring Boot 3.0 with Java 17
- PostgreSQL database with Flyway migrations
- OpenFeign for Spotify API integration
- Auth0 for authentication
- MapStruct for object mapping
- Docker containerization
- Runs on port 8980

**Frontend (crates-frontend/):**
- Angular 15.0 with TypeScript
- NgRx for state management
- Bootstrap 5 with Bootstrap Icons
- Mobile-first responsive design
- Runs on port 4311

**Public Sharing Service (crates-public/):**
- Go 1.24 with Gin web framework
- Server-side rendered templates
- Alpine.js for progressive enhancement
- Docker containerization
- Runs on port 8080 (prod) / 8337 (dev)

**Database (crates-database/):**
- PostgreSQL in Docker container
- Flyway database migrations

## Development Setup

### Prerequisites
- Java 17+
- Maven
- Docker
- Node.js/npm/yarn
- Go 1.24+ (for public sharing service)

### Starting the Application

1. **Start Database:**
   ```bash
   cd crates-database
   ./start-database.sh
   # Or: ./mvnw clean install docker:start
   ```

2. **Configure Backend:**
   - Copy `crates-backend/src/main/resources/application-dev-example.properties` 
   - Rename to `application-dev.properties`
   - Fill in Spotify client ID and secret

3. **Start Backend:**
   ```bash
   cd crates-backend
   ./restart.sh
   # Or manually: ./mvnw clean install -Pdocker -DskipTests && docker rm -f crates-backend && ./mvnw docker:start
   ```

4. **Start Public Sharing Service:**
   ```bash
   cd crates-public
   ./start-public.sh
   # Or manually: go build && BACKEND_URL=http://localhost:8980 ./crates-public
   ```

5. **Start Frontend:**
   ```bash
   cd crates-frontend
   yarn install  # or npm install
   yarn start    # or npm start
   ```

6. **Access Application:** 
   - Main app: http://localhost:4311
   - Public sharing: http://localhost:8337

## Common Commands

### Backend
```bash
# Restart backend (preferred method)
./restart.sh

# Build and run in Docker (manual method)
./mvnw clean install -Pdocker -DskipTests
./mvnw docker:start

# Run tests
./mvnw test

# Build without Docker
./mvnw clean install
./mvnw spring-boot:run
```

### Frontend
```bash
# Development server
yarn start  # Runs on http://localhost:4311

# Build for production
yarn build:prod

# Run tests
yarn test

# Generate new component
ng generate component component-name
```

### Public Sharing Service
```bash
# Build and run
go build
BACKEND_URL=http://localhost:8980 ./crates-public

# Run with auto-reload (if using air)
air

# Build for production
go build -ldflags="-s -w"
```

### Database
```bash
# Start database container
cd crates-database
./start-database.sh

# Stop container
./stop-database.sh

# Restart container
./restart-database.sh
```

## Key Integrations

**Spotify API:**
- OAuth2 authentication flow
- Library synchronization
- Album and artist metadata retrieval
- Configured via environment variables

**Auth0:**
- User authentication and authorization
- JWT token validation
- Issuer: https://crates.us.auth0.com/

## Project Structure

**Backend Services:**
- `controller/` - REST API endpoints including new PublicController
- `service/` - Business logic layer with user profile and sharing services
- `repository/` - Data access layer
- `entity/` - JPA entities with public sharing fields
- `spotify/client/` - Spotify API integration
- `security/` - Authentication and authorization

**Frontend Modules:**
- `auth/` - Authentication components and services
- `library/` - Spotify library management
- `crate/` - Crates management with privacy controls
- `user/` - User profile management and settings
- `shared/` - Reusable components including mobile navigation
- `layout/` - Layout components including mobile footer
- `store/` - NgRx state management

**Public Sharing Service:**
- `main.go` - Go application entry point
- `backend.go` - Backend API client integration
- `templates/` - Server-side rendered HTML templates
- `static/` - CSS, JS, and image assets

## Environment Configuration

**Required Environment Variables:**
- `SPOTIFY_CLIENT_ID` - Spotify application client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify application client secret
- `SPOTIFY_REDIRECT_URI` - OAuth redirect URI
- `CRATES_AUTH_CALLBACK_URI` - Frontend callback URI
- `CRATES_ENCRYPTION_KEY` - Token encryption key
- `BACKEND_URL` - Backend API URL for public sharing service

**Database Configuration:**
- Host: `crates-database:5432` (Docker network)
- Database: `crates`
- Username: `crates`
- Password: `cratesforfun`

**Public Sharing URLs:**
- Development: http://localhost:8337
- Production: https://crates.page

## Development Patterns

**Backend:**
- Service layer pattern with interfaces and implementations
- MapStruct for DTO mapping
- Custom exceptions for domain-specific errors
- Aspect-oriented programming for Spotify authorization
- Repository pattern with Spring Data JPA

**Frontend:**
- Component-based architecture
- Reactive programming with RxJS
- NgRx store for state management
- Feature modules with lazy loading
- Bootstrap utilities for responsive design
- Mobile-first responsive design patterns
- **Dual Tab System**: Separate tab implementations for desktop and mobile viewports that both need updating when adding new tabs

**Public Sharing Service:**
- Server-side rendering for SEO and social sharing
- RESTful API design patterns
- Progressive enhancement with Alpine.js
- Containerized deployment with Docker

## Testing

**Backend:**
- JUnit 5 with Spring Boot Test
- TestContainers for integration tests
- Embedded PostgreSQL for test database

**Frontend:**
- Jasmine and Karma for unit tests
- Angular Testing Utilities

## Features

### Core Features
- **Music Organization**: Organize Spotify albums into custom "crates" (categories)
- **Library Synchronization**: Automatic sync with Spotify library
- **Album Management**: Add/remove albums, search, and filter functionality

### Public Sharing Features
- **Public Profiles**: Users can set custom usernames and bio
- **Public Crates**: Share individual crates publicly with unique URLs
- **SEO Optimized**: Server-side rendered pages for social media sharing
- **Mobile Responsive**: Mobile-first design with dedicated mobile navigation

### User Profile Management
- **Custom Handles**: Unique usernames (64 chars, alphanumeric + hyphens) - **IMPORTANT: Not all users have handles**
- **Bio**: Personal bio field (280 character limit)
- **Privacy Controls**: Toggle individual crates between public/private

## Important Development Notes

### User Handles
**CRITICAL:** Not all users have handles. Some users only have a `spotifyId` and no custom `handle`. 

- **NEVER use handles for internal Angular routing - only for public URLs**
- When navigating to user profiles, always use `user.id` (numeric ID), never `user.handle`
- When displaying usernames, use fallback: `user.handle || user.spotifyId`
- Public sharing URLs use: `user.handle || user.spotifyId` for the username segment
- Internal app navigation should use: `/user/{user.id}` for reliability

### Dual Tab System
**IMPORTANT:** The frontend uses separate tab implementations for desktop and mobile viewports:

- **Desktop tabs**: Standard Bootstrap nav tabs, visible on larger screens
- **Mobile tabs**: Custom mobile navigation, visible on smaller screens
- **BOTH systems must be updated simultaneously** when adding new tabs or navigation items
- Use responsive display classes (`d-md-block`, `d-md-none`) to show/hide appropriate tab system

### Common Patterns
```typescript
// ❌ BAD - handle might be null
this.router.navigate(['/user', user.handle]);

// ❌ BAD - do not use handles for ANY internal Angular routing
this.router.navigate(['/user/handle', user.handle]);

// ✅ GOOD - ID is always present for internal navigation
this.router.navigate(['/user', user.id]);

// ✅ GOOD - handles only for public URLs
window.open(`https://crates.page/${user.handle}`, '_blank');

// ✅ GOOD - Display name with fallback
displayName = user.handle || user.spotifyId;
```

## Docker Network

All services run on the `crates-network` Docker network:
- `crates-database` - PostgreSQL (port 5432)
- `crates-backend` - Spring Boot API (port 8980)
- `crates-public` - Go sharing service (port 8080/8337)
- Frontend runs locally on port 4311