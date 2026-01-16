/**
 * Backend Proxy Server for Mistral Agents API
 * Handles CORS and proxies requests to Mistral's Agents API
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PROXY_PORT || 3001;

// Enable CORS for all routes
app.use(cors({
    origin: ['https://localhost:5241', 'http://localhost:5241', 'https://new.express.adobe.com'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
    console.error('⚠️ MISTRAL_API_KEY is not set in backend .env file!');
}

// Proxy endpoint for creating agents
app.post('/api/mistral/agents', async (req, res) => {
    if (!MISTRAL_API_KEY) {
        return res.status(500).json({ error: 'MISTRAL_API_KEY not configured on server' });
    }

    try {
        // Use /v1/agents instead of /v1/beta/agents
        const response = await fetch('https://api.mistral.ai/v1/agents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MISTRAL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Error proxying agent creation:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for starting conversations
app.post('/api/mistral/conversations/start', async (req, res) => {
    if (!MISTRAL_API_KEY) {
        return res.status(500).json({ error: 'MISTRAL_API_KEY not configured on server' });
    }

    try {
        // Use /v1/conversations instead of /v1/beta/agents/conversations/start
        const response = await fetch('https://api.mistral.ai/v1/conversations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MISTRAL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Error proxying conversation start:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for downloading files
app.get('/api/mistral/files/:fileId', async (req, res) => {
    if (!MISTRAL_API_KEY) {
        return res.status(500).json({ error: 'MISTRAL_API_KEY not configured on server' });
    }

    try {
        const { fileId } = req.params;
        
        // First, try to get the file content directly
        // Mistral API might use /v1/files/{fileId}/content for binary downloads
        let response = await fetch(`https://api.mistral.ai/v1/files/${fileId}/content`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            },
        });
        
        // If /content endpoint doesn't work, try the regular endpoint
        if (!response.ok && response.status === 404) {
            response = await fetch(`https://api.mistral.ai/v1/files/${fileId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${MISTRAL_API_KEY}`,
                },
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        // Get the content type from the response
        const contentType = response.headers.get('content-type') || '';
        
        // Check if response is JSON (metadata) or binary (image)
        if (contentType.includes('application/json')) {
            // If it's JSON, it's metadata - we need to get the actual file content
            const jsonData = await response.json();
            console.log('File metadata received, attempting to get content...');
            
            // Try the /content endpoint to get the actual binary
            const contentResponse = await fetch(`https://api.mistral.ai/v1/files/${fileId}/content`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${MISTRAL_API_KEY}`,
                },
            });
            
            if (contentResponse.ok) {
                const imageBuffer = await contentResponse.buffer();
                const imageContentType = contentResponse.headers.get('content-type') || jsonData.mimetype || 'image/jpeg';
                res.setHeader('Content-Type', imageContentType);
                res.setHeader('Content-Length', imageBuffer.length);
                return res.send(imageBuffer);
            } else {
                // If /content doesn't work, return metadata
                console.log('Content endpoint failed, returning metadata');
                return res.json(jsonData);
            }
        }
        
        // It's already binary data (image)
        const buffer = await response.buffer();
        const finalContentType = contentType || 'image/jpeg';
        res.setHeader('Content-Type', finalContentType);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error) {
        console.error('Error proxying file download:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', mistralConfigured: !!MISTRAL_API_KEY });
});

app.listen(PORT, () => {
    console.log(`🚀 Mistral Proxy Server running on http://localhost:${PORT}`);
    console.log(`📝 MISTRAL_API_KEY configured: ${MISTRAL_API_KEY ? 'Yes' : 'No'}`);
});
