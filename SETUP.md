# Quick Setup Guide

## 🔑 Configuring Gemini API Key

Since this is a browser-based add-on, environment variables don't work directly. You have two options:

### Option 1: Direct Configuration (Quick for MVP/Hackathon)

1. Open `src/services/geminiService.ts`
2. Find this line:
   ```typescript
   const GEMINI_API_KEY = ... || "YOUR_GEMINI_API_KEY_HERE";
   ```
3. Replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual Gemini API key:
   ```typescript
   const GEMINI_API_KEY = "your-actual-api-key-here";
   ```

Get your API key from: https://ai.google.dev/

### Option 2: Webpack DefinePlugin (For Production)

If you want to use environment variables, configure webpack's DefinePlugin:

1. Install dotenv-webpack (optional):
   ```bash
   npm install --save-dev dotenv-webpack
   ```

2. Update `webpack.config.js`:
   ```javascript
   const Dotenv = require('dotenv-webpack');
   
   module.exports = {
     // ... existing config
     plugins: [
       new Dotenv(),
       new webpack.DefinePlugin({
         'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
       }),
       // ... other plugins
     ]
   };
   ```

3. Create a `.env` file (don't commit to git):
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### Option 3: Backend Proxy (Most Secure for Production)

For production, create a backend service that:
1. Stores API keys securely
2. Proxies requests to Gemini API
3. Never exposes API keys to the client

Update `geminiService.ts` to call your backend instead of directly calling Gemini.

## ⚠️ Security Note

**Never commit API keys to version control!**

- Add `src/services/geminiService.ts` to `.gitignore` if it contains your key, OR
- Use environment variables with a backend proxy, OR
- Keep keys in a secure configuration system

## 🚀 Next Steps

After configuring your API key:

1. Install dependencies: `npm install`
2. Start dev server: `npm run start`
3. Build: `npm run build`
4. Load in Adobe Express: Point to `dist` folder

See README.md for full documentation.
