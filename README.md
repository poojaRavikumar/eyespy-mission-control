# Mission Control — Eye Spy Foundation

Plain HTML dashboard. No framework. Two serverless API functions. Deploys to Vercel in 2 minutes.

## Files

```
index.html          ← the entire dashboard UI
api/deals.js        ← fetches Grant Pipeline from HubSpot
api/emails.js       ← fetches last 5 sent Marketing Emails
vercel.json         ← routing config
```

## Deploy to Vercel

### Option A — Drag & Drop (fastest)
1. Go to https://vercel.com/new
2. Drag this entire folder onto the page
3. Click Deploy
4. After deploy: go to Settings → Environment Variables → add:
   - Key: `HUBSPOT_ACCESS_TOKEN`
   - Value: your token
5. Redeploy (Settings → Deployments → Redeploy)

### Option B — GitHub (recommended for Nick's access)
1. Push this folder to a GitHub repo
2. Go to https://vercel.com/new → Import Git Repository
3. Select your repo → Deploy
4. Add environment variable: `HUBSPOT_ACCESS_TOKEN`
5. Redeploy

## HubSpot Token
Generate at: https://app.hubspot.com/personal-access-key/42383838
Never commit the token — always set it as a Vercel environment variable.

## Deal Stages
If your HubSpot stage names differ from the defaults, edit the STAGE_MAP in api/deals.js.
