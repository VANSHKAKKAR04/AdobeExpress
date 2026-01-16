# Mistral Proxy Server

Backend proxy server to handle CORS issues when calling Mistral's Agents API from the browser.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create a `.env` file in the `backend` directory:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
PROXY_PORT=3001
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Testing

Test the image generation API locally:
```bash
node test-image-generation.js
```

This will:
1. Test backend health
2. Create an image generation agent
3. Generate an image via conversation
4. Download and save the generated image

**Note:** Mistral has rate limits on image generation. If you see a 429 error, wait a few minutes before trying again.

## Configuration

The server runs on port 3001 by default. You can change this by setting `PROXY_PORT` in the `.env` file.

## Frontend Configuration

Make sure your frontend `.env` file includes:
```env
PROXY_URL=http://localhost:3001
```

Or update `mistralImageGenerationService.ts` to use your proxy URL.

## Endpoints

- `POST /api/mistral/agents` - Create a Mistral agent
- `POST /api/mistral/conversations/start` - Start a conversation with an agent
- `GET /api/mistral/files/:fileId` - Download a file from Mistral
- `GET /health` - Health check endpoint

## Security Note

This proxy server should only be used in development. For production, you should:
- Add authentication/authorization
- Use environment-specific API keys
- Add rate limiting
- Use HTTPS
