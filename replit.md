# InsiderTrack Pro - AI-Powered Insider Trading Monitor

## Overview

InsiderTrack Pro is a sophisticated financial data dashboard that monitors insider trading activity from SEC filings and provides AI-powered analysis to generate actionable trading signals. The application automatically collects and processes Form 4 filings from the SEC's RSS feeds, analyzes them using OpenAI's GPT model to extract insights and significance scores, and presents them through a professional, real-time dashboard interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The client-side application uses a modern React-based stack with TypeScript for type safety and enhanced developer experience:

**Core Framework**: React 18 with TypeScript, utilizing Vite as the build tool and development server for fast hot module replacement and optimized production builds.

**UI Component System**: Implements shadcn/ui components built on top of Radix UI primitives, providing accessible and customizable components. The design system follows Material Design principles adapted for financial applications, emphasizing data density, trust, and clarity.

**Styling**: TailwindCSS with a custom design token system supporting both light and dark themes. The color palette is specifically designed for financial data visualization with semantic colors for buy/sell/hold signals.

**State Management**: TanStack Query (React Query) for server state management, providing caching, synchronization, and background updates. Local component state managed with React hooks.

**Routing**: Wouter for client-side routing, providing a lightweight alternative to React Router with similar functionality.

**Real-time Updates**: WebSocket integration for live trading data updates, allowing users to receive new insider trading alerts without page refreshes.

### Backend Architecture

**Server Framework**: Express.js with TypeScript, providing a RESTful API architecture for handling client requests and serving static assets.

**Database Layer**: Uses Drizzle ORM with PostgreSQL (specifically Neon serverless PostgreSQL) for type-safe database operations and schema management. The ORM provides compile-time type checking and automatic migration generation.

**Data Collection**: Automated SEC filing collector that runs on a scheduled interval (every 10 minutes) to fetch the latest Form 4 insider trading filings from SEC RSS feeds. Implements caching mechanisms to avoid duplicate processing.

**AI Analysis Pipeline**: Integrates with OpenAI GPT-5 API to analyze insider trading data and generate:
- Significance scores (1-100)
- Signal classifications (BUY/SELL/HOLD)
- Key insights and reasoning
- Risk level assessments
- Investment recommendations

**Session Management**: Uses connect-pg-simple for PostgreSQL-backed session storage, providing persistent user sessions.

**Real-time Communication**: WebSocket server implementation for broadcasting live updates to connected clients when new insider trades are processed.

### Data Storage Solutions

**Primary Database**: PostgreSQL hosted on Neon serverless platform, chosen for its reliability, ACID compliance, and excellent support for JSON data types (used for storing AI analysis results).

**Schema Design**: 
- Users table for authentication and user management
- InsiderTrades table storing processed SEC filing data with AI analysis results
- Optimized indexes on frequently queried fields (ticker symbols, filing dates, accession numbers)

**Data Processing**: Implements upsert patterns to handle duplicate filings and ensure data consistency during automated collection processes.

### Authentication and Authorization

Currently implements a basic user system with:
- Email/password authentication using bcryptjs for password hashing
- JWT token-based session management
- User-specific data access patterns (prepared for future user-specific features like watchlists)

### External Service Integrations

**SEC EDGAR System**: Direct integration with SEC's RSS feeds to collect real-time insider trading filings (Form 4). Handles XML parsing and data transformation from SEC format to application schema.

**OpenAI API**: Integration with GPT-5 for natural language processing and analysis of insider trading patterns. Provides structured analysis including significance scoring, signal classification, and investment insights.

**Neon Database**: Serverless PostgreSQL database service providing scalable, managed database infrastructure with excellent developer experience and TypeScript integration.

**Font Services**: Google Fonts integration for typography (Inter for UI text, JetBrains Mono for data display), chosen for optimal readability in financial data contexts.

The architecture emphasizes real-time data processing, type safety throughout the stack, and scalable design patterns suitable for handling high-frequency financial data updates. The system is designed to be responsive to market conditions while providing reliable, actionable insights to users.