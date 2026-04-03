# RegReady

**AI-Powered Regulatory Risk & Compliance Tool for Product Teams**

Turning regulatory complexity into engineering clarity — so your team ships compliant AI products without deciphering 200-page statutes.

[**Try it Live**](https://reg-ready.vercel.app/)  |  [View Source](https://github.com/delschlangen/regready)

---

## What RegReady Does

RegReady helps product and engineering teams navigate the fast-moving landscape of global AI regulation. It provides four tools — a regulatory radar for tracking new developments, a translator that converts legal text into engineering requirements, a risk scorer that evaluates AI product features against global regulatory frameworks, and a SAIF mapper that maps regulatory obligations to Google's Secure AI Framework.

Instead of waiting weeks for a legal review, you get a rolling regulatory feed, risk classifications, framework coverage analysis, prioritized engineering requirements, and ready-to-file Jira tickets in seconds.

### Regulatory Radar
A rolling 30-day dashboard of AI regulatory developments across three data sources:
- **US State legislation (curated)** — enacted laws from Texas, Colorado, California, Utah, Illinois, and more with accurate dates, summaries, and product impact notes
- **US Federal (live)** — real-time data from the Federal Register API, auto-summarized by Claude
- **EU regulatory items (curated)** — AI Act codes of practice, Digital Omnibus proposal, Article 5 guidelines
- **Filter controls** — filter by jurisdiction, status (Enacted / Proposed / Guidance), and relevance level
- **Send-to-tab buttons** — send any item directly to the Translator or Risk Scorer for deeper analysis

### Reg-to-Reqs Translator
Paste any regulatory provision and get back:
- **Product impact summary** — plain-English explanation of what the regulation means for your product, with specific affected product areas and risk vectors
- **Engineering requirements** — structured, prioritized requirements (Must Have / Should Have / Nice to Have) with regulatory traceability and compliance deadlines
- **Implementation tickets** — mock Jira tickets with acceptance criteria, story points, and labels that an engineer can start working from immediately
- **Downstream dependencies** — related regulatory obligations triggered by the analyzed provision that engineering and program management need to plan for

### Risk Triage Scorer
Describe any AI product feature and get back:
- **Risk classification** — EU AI Act tier (Unacceptable / High Risk / Limited Risk / Minimal Risk) with confidence calibration and regulatory basis
- **Regulatory exposure matrix** — multi-jurisdictional analysis with binding authority classification (Binding Law, Voluntary Framework, Regulatory Guidance, or Enforcement Precedent Only)
- **Vulnerability flags** — color-coded by severity (Critical / High / Medium / Low), with a dedicated **THRESHOLD** flag for features sitting at regulatory tier boundaries
- **Compounding risk analysis** — where multiple regulations create overlapping obligations
- **Recommended actions** — prioritized (P0–P3) with suggested owners and timelines
- **Downstream dependencies** — related regulatory obligations triggered by the risk assessment
- **Compliant path summary** — whether the system can be deployed as-is, needs modifications, or is fundamentally prohibited, with a description of what a compliant version looks like

### SAIF Mapper
Map regulatory requirements against Google's publicly available Secure AI Framework (SAIF):
- **Radar chart** — hexagonal spider chart showing coverage across all 6 SAIF elements with a compliance readiness score
- **Element mapping matrix** — expandable rows for each SAIF element showing coverage status (Fully Addressed / Partially Addressed / Gap), specific controls, and gaps
- **Gap recommendations** — prioritized actions to close gaps between SAIF controls and regulatory requirements, with owners and implementation notes
- **Cross-framework insights** — observations about how SAIF relates to NIST AI RMF, ISO 42001, and other frameworks
- **"Map to SAIF" buttons** on Translator and Risk Scorer output for seamless cross-tab analysis

### Pre-Loaded Examples
Each tab ships with 4 curated examples from real regulations and AI use cases so you can explore immediately without writing your own input.

---

## Regulatory Frameworks Covered

| Framework | Jurisdiction | Coverage |
|---|---|---|
| **EU AI Act** (Regulation 2024/1689) | EU | Full risk classification (Annex III), prohibited practices (Art. 5), transparency, fundamental rights |
| **Digital Services Act** (Regulation 2022/2065) | EU | VLOP/VLOSE obligations, content moderation, systemic risk |
| **NIST AI RMF 1.0** | US (Federal) | Voluntary risk management framework, safe harbor implications |
| **Colorado AI Act** (SB 24-205) | US (State) | Algorithmic discrimination, high-risk AI system requirements |
| **Texas TRAIGA** (H.B. 149, 2025) | US (State) | Prohibited practices, discrimination, social scoring |
| **California AI Bills** | US (State) | Transparency and disclosure requirements |
| **FTC Enforcement** | US (Federal) | Enforcement actions on AI/automated decision-making |
| **Sector-Specific** | Multi | HIPAA (health AI), FCRA/ECOA (credit AI), Fair Housing Act, Title VII (employment AI) |

---

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Backend:** Vercel Serverless Functions
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Live Data:** Federal Register API (free, no key required)
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

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        React Frontend                          │
│  ┌────────┐  ┌───────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ Radar  │  │ Translator │  │ Risk Scorer │  │   SAIF     │  │
│  │  Tab   │  │    Tab     │  │    Tab      │  │  Mapper    │  │
│  └───┬────┘  └─────┬─────┘  └──────┬──────┘  └─────┬──────┘  │
│      │             └────────┬───────┴───────────────┘         │
│      │            fetch('/api/analyze')                        │
│      │           mode: translator | riskScorer | saif          │
│      │                      │                                 │
│ fetch('/api/radar-*')       │                                 │
└──────┬──────────────────────┬─────────────────────────────────┘
       │                      │
       ▼                      ▼
┌─────────────────┐  ┌──────────────────────────────────┐
│ Vercel Functions│  │    Vercel Serverless Function     │
│ radar-federal   │  │        api/analyze.js             │
│ radar-summarize │  │  ┌────────────────────────────┐  │
└──┬──────────┬───┘  │  │ System Prompt (per mode)   │  │
   │          │      │  │ + User Input → Claude API  │  │
   │          │      │  │ → Parse JSON → Return      │  │
   │          │      │  └────────────────────────────┘  │
   │          │      └───────────────┬──────────────────┘
   │          │                      │
   ▼          └───────────┬──────────┘
┌────────────┐            │
│  Federal   │            ▼
│  Register  │  ┌──────────────────────────────┐
│  API (free)│  │     Anthropic Claude API      │
└────────────┘  │   claude-sonnet-4-20250514    │
                └──────────────────────────────┘
```

## Why This Exists

Regulatory compliance in AI is one of the most pressing challenges facing technology companies today. Teams struggle to translate dense legal text into actionable engineering work, creating a bottleneck between legal/policy teams and product delivery. RegReady demonstrates how AI itself can close that gap — turning regulatory provisions into structured requirements, risk assessments, and implementation plans that engineering teams can act on immediately.

## Disclaimer

This tool is for demonstration and educational purposes. It does not constitute legal advice. Always consult qualified legal counsel for compliance decisions.

## License

MIT
