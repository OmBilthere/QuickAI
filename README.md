# QuickAI - Full-Stack AI Productivity Platform

QuickAI is a production-style SaaS application that helps users create and improve content using AI.
It combines text generation, image workflows, and resume analysis in a single authenticated dashboard.

## Project Overview

- Project Type: Full-stack AI SaaS web app
- Domain: Content productivity and creator tools
- User Value: Faster content creation, image cleanup, and career document feedback
- Architecture: React SPA + Node/Express API + Neon Postgres + Clerk authentication
- Key Integrations: Gemini (via OpenAI-compatible SDK), ClipDrop, Cloudinary, Clerk
- End-to-end ownership across frontend, backend, auth, AI integrations, and deployment-ready structure
- Real-world API orchestration with multiple third-party services
- Subscription-aware feature gating (free vs premium) with usage limits
- File upload handling, PDF parsing, and cleanup of temporary files
- Data persistence for user creations, public publishing, and like interactions
- Error handling and user-facing feedback across async workflows

## Core Features

### 1) AI Writing Tools
- Article generation from prompts
- Blog title generation with category context
- Result persistence to user history/dashboard

### 2) AI Image Tools
- Text-to-image generation
- Background removal from uploaded image
- Object removal from uploaded image using prompt-based removal
- Optional publish flag for community feed

### 3) Resume Review Tool
- Upload PDF resume (up to 5 MB)
- Parse text from PDF
- Generate actionable resume feedback in markdown format

### 4) Community + Engagement
- Public creations feed for published images
- Like/unlike interactions for authenticated users

### 5) Access Control and Plan Logic
- Clerk-based authentication and protected routes
- Free plan usage tracking
- Premium-only gating for selected AI features

## Product Flow (User Journey)

1. User signs in via Clerk.
2. User enters AI dashboard and selects a tool.
3. Frontend sends authorized API requests using bearer token.
4. Backend validates auth, plan, and input.
5. AI/provider service returns output.
6. Output is stored in database and rendered in UI.
7. User can view creation history and optionally publish image output.

## Tech Stack

### Frontend
- React 19
- Vite 8
- React Router
- Tailwind CSS 4
- Clerk React SDK
- Axios
- React Hot Toast

### Backend
- Node.js + Express 5
- Clerk Express middleware
- OpenAI SDK (pointed to Gemini endpoint)
- Neon serverless Postgres client
- Cloudinary SDK
- Multer (file uploads)
- PDF parsing library
- Axios (external API calls)

### AI and Media Services
- Gemini 2.5 Flash (text generation)
- ClipDrop API (image generation)
- Cloudinary (media storage and transformations)

## High-Level Architecture

```text
Client (React)
  -> Auth token via Clerk
  -> Calls Express APIs (/api/ai, /api/user)

Server (Express)
  -> Auth + plan middleware
  -> AI controller (Gemini + ClipDrop + Cloudinary)
  -> User controller (history + community interactions)
  -> Neon Postgres persistence
```

## API Surface (Important Routes)

### AI Routes
- POST /api/ai/generate-article
- POST /api/ai/generate-blog-title
- POST /api/ai/generate-image
- POST /api/ai/remove-image-background
- POST /api/ai/remove-image-object
- POST /api/ai/resume-review

### User Routes
- GET /api/user/get-user-creations
- GET /api/user/get-published-creations
- POST /api/user/toggle-like-creation

## Environment Variables

Create separate environment files for client and server.

### Client (.env)
- VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
- VITE_BASE_URL=http://localhost:3000

### Server (.env)
- PORT=3000
- DATABASE_URL=your_neon_database_url
- GEMINI_API_KEY=your_gemini_api_key
- CLIPDROP_API_KEY=your_clipdrop_api_key
- CLOUDINARY_CLOUD_NAME=your_cloud_name
- CLOUDINARY_API_KEY=your_cloudinary_api_key
- CLOUDINARY_API_SECRET=your_cloudinary_api_secret
- CLERK_SECRET_KEY=your_clerk_secret_key

## Local Setup

### 1) Clone and Install

```bash
git clone https://github.com/OmBilthere/QuickAI
cd QuickAI

cd client
npm install

cd ../server
npm install
```

### 2) Add Environment Variables
- Add .env in client and server directories with values above.

### 3) Run Development Servers

```bash
# terminal 1
cd server
npm run server

# terminal 2
cd client
npm run dev
```

