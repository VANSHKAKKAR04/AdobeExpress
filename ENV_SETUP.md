# Environment Variable Setup

## How to Set Up Your API Key

1. **Create a `.env` file** in the root directory (same folder as `package.json`)

2. **Add your API key** to the file:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Get your API key** from: https://ai.google.dev/

4. **Restart your development server** after creating/updating the `.env` file:
   ```bash
   npm run start
   ```

## Example `.env` file:

```
GEMINI_API_KEY=AIzaSyYourActualAPIKeyHere
```

## Important Notes:

- ⚠️ **Never commit `.env` to version control** - it's already in `.gitignore`
- The `.env` file is loaded by webpack at build time
- If you change the `.env` file, you need to rebuild/restart the dev server
- The API key is injected into the bundle at build time (it will be visible in the built JavaScript - for production, use a backend proxy instead)

## Troubleshooting:

If you see "GEMINI_API_KEY is not set":
1. Check that `.env` file exists in the root directory
2. Check that it contains `GEMINI_API_KEY=your_key` (no quotes needed)
3. Make sure there are no extra spaces around the `=`
4. Restart your dev server (`npm run start`)
5. Rebuild if needed (`npm run build`)
