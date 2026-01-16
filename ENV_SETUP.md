# Environment Variable Setup

## How to Set Up Your API Key

1. **Create a `.env` file** in the root directory (same folder as `package.json`)

2. **Add your API keys** to the file:
   ```
   MISTRAL_API_KEY=your_mistral_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Backend Proxy URL (for template generation)
# Default: http://localhost:3001
PROXY_URL=http://localhost:3001

### Backend (.env in backend/ directory)

For template generation to work, you need to run the backend proxy server. Create a `.env` file in the `backend/` directory:

```env
MISTRAL_API_KEY=your_mistral_api_key_here
PROXY_PORT=3001
```

Then start the backend server:
```bash
cd backend
npm install
npm start
```
   ```

3. **Get your API keys**:
   - Mistral API key: https://console.mistral.ai/
   - Gemini API key: https://aistudio.google.com/app/apikey (free tier available)

4. **Restart your development server** after creating/updating the `.env` file:
   ```bash
   npm run start
   ```

## Example `.env` file:

```
MISTRAL_API_KEY=your_mistral_api_key_here
GEMINI_API_KEY=AIzaSyYourActualAPIKeyHere
```

## API Key Priority:

- **Mistral API Key**: Required for brand kit extraction (primary service)
- **Gemini API Key**: Optional, used for graphics detection (free tier: 15 requests/minute, 1,500/day)
  - If not set, the system will fallback to Mistral's graphics detection

## Important Notes:

- ⚠️ **Never commit `.env` to version control** - it's already in `.gitignore`
- The `.env` file is loaded by webpack at build time
- If you change the `.env` file, you need to rebuild/restart the dev server
- The API key is injected into the bundle at build time (it will be visible in the built JavaScript - for production, use a backend proxy instead)

## Troubleshooting:

If you see "MISTRAL_API_KEY is not set":
1. Check that `.env` file exists in the root directory
2. Check that it contains `MISTRAL_API_KEY=your_key` (no quotes needed)
3. Make sure there are no extra spaces around the `=`
4. Restart your dev server (`npm run start`)
5. Rebuild if needed (`npm run build`)

If you see "GEMINI_API_KEY is not set":
- This is optional - the system will use Mistral as fallback for graphics detection
- To enable Gemini Vision (free tier), add `GEMINI_API_KEY=your_key` to `.env`
