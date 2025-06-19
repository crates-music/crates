# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crates is a music organization tool that allows users to organize their Spotify library albums into custom categories called "crates." The application consists of a Spring Boot backend, Angular frontend, and PostgreSQL database.

**Live Version:** https://app.crates.page

## Architecture

**Backend (crates-backend/):**
- Spring Boot 3.0 with Java 17
- PostgreSQL database with Flyway migrations
- OpenFeign for Spotify API integration
- Auth0 for authentication
- MapStruct for object mapping
- Docker containerization

**Frontend (crates-frontend/):**
- Angular 15+ with TypeScript
- NgRx for state management
- Bootstrap 5 with Bootstrap Icons
- Runs on port 4311

**Database (crates-database/):**
- PostgreSQL in Docker container
- Flyway database migrations

## Development Setup

### Prerequisites
- Java 17+
- Maven
- Docker
- Node.js/npm/yarn

### Starting the Application

1. **Start Database:**
   ```bash
   cd crates-database
   ./mvnw clean install docker:start
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

4. **Start Frontend:**
   ```bash
   cd crates-frontend
   yarn install  # or npm install
   yarn start    # or npm start
   ```

5. **Access Application:** http://localhost:4311

## Common Commands

### Backend
```bash
# Build and run in Docker
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

### Database
```bash
# Start database container
cd crates-database
./mvnw clean install docker:start

# Stop container
./mvnw docker:stop
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
- `controller/` - REST API endpoints
- `service/` - Business logic layer
- `repository/` - Data access layer
- `entity/` - JPA entities
- `spotify/client/` - Spotify API integration
- `security/` - Authentication and authorization

**Frontend Modules:**
- `auth/` - Authentication components and services
- `library/` - Spotify library management
- `crate/` - Crates (categories) management
- `shared/` - Reusable components and services
- `store/` - NgRx state management

## Environment Configuration

**Required Environment Variables:**
- `SPOTIFY_CLIENT_ID` - Spotify application client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify application client secret
- `SPOTIFY_REDIRECT_URI` - OAuth redirect URI
- `CRATES_AUTH_CALLBACK_URI` - Frontend callback URI
- `CRATES_ENCRYPTION_KEY` - Token encryption key

**Database Configuration:**
- Host: `crates-database:5432` (Docker network)
- Database: `crates`
- Username: `crates`
- Password: `cratesforfun`

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

## Testing

**Backend:**
- JUnit 5 with Spring Boot Test
- TestContainers for integration tests
- Embedded PostgreSQL for test database

**Frontend:**
- Jasmine and Karma for unit tests
- Angular Testing Utilities

## Docker Network

All services run on the `crates-network` Docker network:
- `crates-database` - PostgreSQL (port 5432)
- `crates-backend` - Spring Boot API (port 8980)
- Frontend runs locally on port 4311