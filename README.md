# RegReady

**AI Compliance Architecture Tool** — Turning regulatory complexity into engineering clarity.

![RegReady Screenshot](https://via.placeholder.com/800x450?text=RegReady+Screenshot)

## What This Does

RegReady is a production-quality, AI-powered tool that helps product and engineering teams navigate the increasingly complex landscape of AI regulation. It bridges the gap between legal/regulatory text and actionable engineering work by providing two core capabilities: translating raw regulatory provisions into structured requirements and mock Jira tickets, and scoring AI product features against global regulatory frameworks.

Built as a single-page React application with a Claude API backend, RegReady demonstrates how AI can accelerate compliance workflows — turning dense legal text into clear product impact summaries, prioritized engineering requirements, and ready-to-file implementation tickets in seconds.

## Features

### Reg-to-Reqs Translator
- Paste any regulatory text (EU AI Act, DSA, Colorado AI Act, etc.)
- Get a plain-English product impact summary
- Receive structured engineering requirements with priority levels and traceability
- Generate mock Jira tickets with acceptance criteria, story points, and labels
- 4 pre-loaded examples from real regulations

### Risk Triage Scorer
- Describe any AI product feature or use case
- Get an EU AI Act risk classification (Unacceptable / High / Limited / Minimal)
- View a regulatory exposure matrix across multiple jurisdictions
- See color-coded vulnerability flags with compounding risk analysis
- Receive prioritized recommended actions with ownership and timelines
- Monitor regulatory indicators with trigger actions
- 4 pre-loaded examples covering diverse AI use cases

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Vercel Serverless Functions
- **LLM:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Deployment:** Vercel
- **Font:** Inter (Google Fonts)

## Getting Started

### Prerequisites
- Node.js 18+
- An Anthropic API key

### Local Development

```bash
# Clone the repo
git clone https://github.com/delschlangen/regready.git
cd regready

# Install dependencies
npm install

# Add your API key
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Start with Vercel CLI (recommended — handles serverless functions)
npm i -g vercel
vercel dev
```

Alternatively, use `npm run dev` for frontend-only development (API calls require the Vercel dev server or a deployed backend).

## Deployment to Vercel

### Step 1: Connect Your GitHub Repo
1. Go to [vercel.com](https://vercel.com) and sign in (or sign up) with your GitHub account
2. Click **"Add New..."** > **"Project"** from the dashboard
3. You'll see a list of your GitHub repos — find **regready** and click **"Import"**

### Step 2: Configure Build Settings
Vercel should auto-detect the Vite framework. Verify these settings:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 3: Add Environment Variables
1. On the same deployment page, expand **"Environment Variables"**
2. Add the following:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** Your Anthropic API key (starts with `sk-ant-`)
3. Make sure it's enabled for **Production**, **Preview**, and **Development**
4. Click **"Add"**

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (usually under 60 seconds)
3. Vercel will give you a URL like `regready-xxxx.vercel.app`

### Step 5: Verify
1. Visit your deployment URL
2. Select an example from the dropdown and click the action button
3. You should see real AI-generated analysis appear after a few seconds

### Custom Domain (Optional)
1. Go to your project's **Settings** > **Domains**
2. Type your custom domain and click **"Add"**
3. Vercel will show you DNS records to add at your domain registrar
4. Add the records and wait for DNS propagation (usually minutes, sometimes hours)

## Regulatory Frameworks Covered

| Framework | Description |
|---|---|
| **EU AI Act** (Regulation 2024/1689) | Comprehensive AI regulation with four-tier risk classification |
| **Digital Services Act** (Regulation 2022/2065) | Platform liability and content moderation for VLOPs/VLOSEs |
| **NIST AI RMF 1.0** | US federal AI risk management framework |
| **Colorado AI Act** (SB 24-205) | State-level algorithmic discrimination protections |
| **California AI Bills** | Transparency and disclosure requirements |
| **FTC Enforcement** | Federal enforcement actions on AI/automated decisions |

## Architecture

```
┌─────────────────────────────────────────┐
│              React Frontend              │
│  ┌───────────┐    ┌──────────────────┐  │
│  │ Translator │    │  Risk Scorer     │  │
│  │    Tab     │    │     Tab          │  │
│  └─────┬─────┘    └────────┬─────────┘  │
│        └────────┬──────────┘            │
│            fetch('/api/analyze')         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     Vercel Serverless Function          │
│         api/analyze.js                  │
│  ┌─────────────────────────────────┐    │
│  │  System Prompt (per mode)       │    │
│  │  + User Input                   │    │
│  │  → Anthropic Messages API       │    │
│  │  → Parse JSON → Return          │    │
│  └─────────────────────────────────┘    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Anthropic Claude API            │
│      claude-sonnet-4-20250514           │
└─────────────────────────────────────────┘
```

## Why I Built This

Regulatory compliance in AI is one of the most pressing challenges facing technology companies today. Teams often struggle to translate dense legal text into actionable engineering work, creating a bottleneck between legal/policy teams and product delivery. RegReady demonstrates how AI itself can help close that gap — turning regulatory provisions into structured requirements, risk assessments, and implementation plans that engineering teams can act on immediately. It represents the kind of compliance-as-code tooling that will become essential as AI regulation accelerates globally.

## Disclaimer

This tool is for demonstration and educational purposes. It does not constitute legal advice. Always consult qualified legal counsel for compliance decisions.

## License

MIT
