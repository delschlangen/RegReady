# Deploying RegReady

Deploy your own instance to Vercel.

## Step 1: Connect Your GitHub Repo
1. Go to [vercel.com](https://vercel.com) and sign in (or sign up) with your GitHub account
2. Click **"Add New..."** > **"Project"** from the dashboard
3. You'll see a list of your GitHub repos — find **regready** and click **"Import"**

## Step 2: Configure Build Settings
Vercel should auto-detect the Vite framework. Verify these settings:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## Step 3: Add Environment Variables
1. On the same deployment page, expand **"Environment Variables"**
2. Add the following:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** Your Anthropic API key (starts with `sk-ant-`)
3. Make sure it's enabled for **Production**, **Preview**, and **Development**
4. Click **"Add"**

## Step 4: Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (usually under 60 seconds)
3. Vercel will give you a URL like `regready-xxxx.vercel.app`

## Step 5: Verify
1. Visit your deployment URL
2. Select an example from the dropdown and click the action button
3. You should see real AI-generated analysis appear after a few seconds

### Custom Domain (Optional)
1. Go to your project's **Settings** > **Domains**
2. Type your custom domain and click **"Add"**
3. Vercel will show you DNS records to add at your domain registrar
4. Add the records and wait for DNS propagation (usually minutes, sometimes hours)

