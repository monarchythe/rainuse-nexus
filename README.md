# RainUSE Nexus

AI-powered prospecting engine that identifies high-viability commercial and industrial buildings for rainwater reuse using roof area, climate context, and screening-level ROI estimates.

## Overview

RainUSE Nexus is a web-based prototype built for the Grundfos challenge at HackSMU.

The goal is to help identify **which buildings should be targeted first for rainwater reuse systems**. Instead of manual prospecting, the app scans large building footprints, enriches them with rainfall and county-level context, and ranks candidates using a viability score.

The system is designed to answer one core question:

**If Grundfos wanted to prospect an entire state, which buildings are the strongest opportunities, and why?**



## Project Structure

```text
rainuse-nexus/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── dashboard/
│   │   └── page.tsx
│   └── api/
│       ├── footprints/
│       ├── scan-state/
│       └── analyze-roof/
├── components/
├── lib/
├── public/
└── package.json
```

## What the app does

- Lets a user select a U.S. state
- Scans large building footprints from real open data
- Filters for large rooftop catchment areas
- Enriches candidates with rainfall and county-level context
- Computes:
  - viability score
  - annual harvestable rainwater
  - usable gallons
  - screening-level annual savings
- Returns ranked candidate buildings in a dashboard

## Key Features

### Automated state scan
The backend scans a state-wide bounding box, fetches building footprint tiles, filters for large roofs, and returns ranked candidates.

### Viability scoring engine
Each building is scored using a weighted formula based on:
- roof area
- rainfall / harvest potential
- cooling tower confidence
- water cost proxy
- resilience / risk signal
- ESG signal
- regulatory signal

### Prospect ranking dashboard
Users can:
- search/select a state
- scan for candidates
- view ranked building cards
- sort results by score, roof area, savings, and more

### AI rooftop analysis route
The project includes a rooftop analysis API route that is designed to:
- fetch rooftop satellite imagery
- analyze the image for cooling tower presence
- return structured rooftop signals such as:
  - coolingTowerDetected
  - coolingTowerConfidence
  - estimatedTowerCount
  - roofCondition
  - roofMaterial
  - notes

If required private keys are missing, this route gracefully falls back to deterministic mock mode so the project remains runnable.

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend / APIs
- Next.js App Router API routes
- Node.js

### Data / Services
- Microsoft US Building Footprints
- NOAA rainfall normals (hardcoded county/state lookup layer in current prototype)
- FCC Census Area API
- FEMA National Risk Index
- Mapbox Static Images API
- Anthropic / Claude API



## Setup

### 1. Clone the repository

```bash
git clone https://github.com/monarchythe/rainuse-nexus.git
cd rainuse-nexus
```
### 2. Install dependencies
```bash
npm install
```
### 3. Run the development server
```bash
npm run dev
```
### 5. Open the app


### Visit:

http://localhost:3000
#### Optional: Enable real rooftop AI analysis

Create a .env.local file in the project root:

MAPBOX_TOKEN=your_mapbox_token_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

Then restart the dev server:

npm run dev
Running without API keys

The project is still runnable without private API keys.

The main state scan and ranking pipeline will still work
The rooftop AI analysis route will fall back to deterministic mock mode

This allows the project to be reviewed and demoed even without external credentials.
