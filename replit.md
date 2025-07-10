# Construction Project Management Application

## Overview

This is a full-stack construction project management application built with React, Express.js, and PostgreSQL. The application focuses on daily project tracking, delay detection, cost impact analysis, and provides AI-powered recommendations for construction projects.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom construction-themed variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL
- **API Design**: RESTful endpoints with proper error handling
- **Session Management**: PostgreSQL-based session storage

### Build System
- **Frontend Build**: Vite with React plugin
- **Backend Build**: esbuild for production bundling
- **Development**: Hot module replacement via Vite
- **TypeScript**: Strict configuration with path aliases

## Key Components

### 1. Project Management Module
- **Purpose**: Create and manage construction projects with comprehensive resource planning
- **Features**:
  - Project metadata (name, location, dates, working days)
  - Human resource planning (roles, workers, costs)
  - Material management (quantities, costs, usage tracking)
  - Equipment tracking (rental costs, availability)
  - Automated budget calculations
  - Real-time progress monitoring

### 2. Daily Project Reporting (DPR)
- **Purpose**: Daily data collection and progress tracking
- **Features**:
  - Daily progress percentage updates
  - Resource usage tracking and shortages
  - Weather data integration
  - Work completion status
  - Delay and issue reporting

### 3. Analytics Dashboard
- **Purpose**: Visual insights and project performance analysis
- **Features**:
  - Progress charts and trend analysis
  - Budget vs actual cost tracking
  - Resource utilization metrics
  - Delay analysis and forecasting
  - Multi-project comparison views

### 4. AI-Powered Chat Interface
- **Purpose**: Intelligent project assistance and recommendations
- **Features**:
  - Natural language project queries
  - Automated delay and cost impact analysis
  - Resource optimization suggestions
  - Risk assessment and mitigation strategies

## Data Flow

### 1. Project Creation Flow
1. User creates project with basic metadata
2. User adds human resources, materials, and equipment
3. System automatically calculates budgets
4. Project becomes available for daily reporting

### 2. Daily Reporting Flow
1. User selects project for daily report
2. System fetches project resources and weather data
3. User reports progress, resource usage, and issues
4. System analyzes data for delays and cost impacts
5. AI generates recommendations based on patterns

### 3. Analytics Flow
1. System aggregates data from all projects and DPRs
2. Real-time calculations for progress, costs, and delays
3. Visual representation through charts and graphs
4. Comparative analysis across multiple projects

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection**: Pool-based connections with WebSocket support
- **Migrations**: Drizzle Kit for schema management

### AI Services
- **OpenAI GPT-4**: For chat interface and intelligent recommendations
- **Integration**: Delay analysis, cost impact assessment, and optimization suggestions

### Weather API
- **OpenWeatherMap**: Real-time weather data for project locations
- **Fallback**: Default weather data when API unavailable
- **Usage**: Impact assessment for weather-sensitive construction activities

### UI Components
- **Radix UI**: Accessible, unstyled component primitives
- **Lucide React**: Icon library for consistent iconography
- **Recharts**: Data visualization library for analytics charts

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Neon development database
- **Environment**: Replit with cartographer integration

### Production Build
- **Frontend**: Static assets built with Vite
- **Backend**: ESM bundle created with esbuild
- **Database**: Neon production database
- **Deployment**: Node.js server serving static assets and API

### Configuration Management
- **Environment Variables**: DATABASE_URL, OPENAI_API_KEY, WEATHER_API_KEY
- **Database Migration**: Automated schema deployment with Drizzle
- **Asset Management**: Static file serving with proper caching headers

### Database Schema
The application uses a comprehensive schema supporting:
- User management with role-based access
- Project hierarchy with cascading relationships
- Resource tracking (human, material, equipment)
- Daily reporting with progress and issue tracking
- Chat message history for AI interactions
- Flexible miscellaneous budget categories

The schema is designed for scalability with proper indexing and foreign key relationships to maintain data integrity across all project-related entities.