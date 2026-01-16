/**
 * Test script for Mistral Image Generation API
 * Tests the backend proxy and Mistral Agents API integration
 */

const fetch = require('node-fetch');
require('dotenv').config();

const PROXY_URL = 'http://localhost:3001';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
    console.error('❌ MISTRAL_API_KEY not found in .env file');
    process.exit(1);
}

async function testImageGeneration() {
    console.log('🧪 Testing Mistral Image Generation API...\n');

    try {
        // Step 1: Test backend health
        console.log('1️⃣ Testing backend health...');
        const healthResponse = await fetch(`${PROXY_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Backend is running:', healthData);
        console.log('');

        // Step 2: Create an agent with image generation capability
        console.log('2️⃣ Creating image generation agent...');
        const agentResponse = await fetch(`${PROXY_URL}/api/mistral/agents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'mistral-medium-latest',
                name: 'Test Image Generator',
                description: 'Test agent for image generation',
                instructions: 'Use the image generation tool to create images based on user requests. Generate high-quality, professional images.',
                tools: [{ type: 'image_generation' }],
                completion_args: {
                    temperature: 0.3,
                    top_p: 0.95,
                }
            }),
        });

        if (!agentResponse.ok) {
            const errorText = await agentResponse.text();
            console.error('❌ Failed to create agent:', errorText);
            return;
        }

        const agentData = await agentResponse.json();
        const agentId = agentData.id;
        console.log('✅ Agent created successfully!');
        console.log('   Agent ID:', agentId);
        console.log('');

        // Step 3: Start a conversation to generate an image
        console.log('3️⃣ Starting conversation to generate image...');
        const prompt = 'Generate a simple brand template design with a header, main content area, and footer. Use a modern, clean design with blue and white colors.';
        
        const conversationResponse = await fetch(`${PROXY_URL}/api/mistral/conversations/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent_id: agentId,
                inputs: prompt,
            }),
        });

        if (!conversationResponse.ok) {
            const errorText = await conversationResponse.text();
            console.error('❌ Failed to start conversation:', errorText);
            console.log('   Response status:', conversationResponse.status);
            return;
        }

        const conversationData = await conversationResponse.json();
        console.log('✅ Conversation started!');
        console.log('   Response keys:', Object.keys(conversationData));
        
        // Check for outputs
        if (conversationData.outputs && conversationData.outputs.length > 0) {
            console.log('   Number of outputs:', conversationData.outputs.length);
            
            // Look for image file in outputs
            let fileId = null;
            for (const output of conversationData.outputs) {
                if (output.type === 'message.output' && output.content && Array.isArray(output.content)) {
                    for (const chunk of output.content) {
                        if (chunk.type === 'tool_file' && chunk.file_id) {
                            fileId = chunk.file_id;
                            console.log('   ✅ Found image file ID:', fileId);
                            break;
                        }
                    }
                }
            }

            if (fileId) {
                // Step 4: Download the image
                console.log('');
                console.log('4️⃣ Downloading generated image...');
                const fileResponse = await fetch(`${PROXY_URL}/api/mistral/files/${fileId}`);

                if (!fileResponse.ok) {
                    const errorText = await fileResponse.text();
                    console.error('❌ Failed to download file:', errorText);
                    return;
                }

                const fs = require('fs');
                
                // Check content type
                const contentType = fileResponse.headers.get('content-type');
                console.log('   Content-Type:', contentType);
                
                // Check if it's JSON (metadata) or binary (image)
                if (contentType && contentType.includes('application/json')) {
                    const jsonData = await fileResponse.json();
                    console.log('   ⚠️ Received JSON instead of image:', jsonData);
                    
                    // Try to get the actual file content if there's a different endpoint
                    if (jsonData.url) {
                        console.log('   Found file URL, attempting direct download...');
                        const directResponse = await fetch(jsonData.url);
                        const directBuffer = await directResponse.buffer();
                        const filename = `test-generated-image-${Date.now()}.png`;
                        fs.writeFileSync(filename, directBuffer);
                        console.log('✅ Image downloaded from direct URL!');
                        console.log('   Saved as:', filename);
                        console.log('   File size:', (directBuffer.length / 1024).toFixed(2), 'KB');
                    } else {
                        console.log('   Full response:', JSON.stringify(jsonData, null, 2));
                    }
                } else {
                    const buffer = await fileResponse.buffer();
                    const filename = `test-generated-image-${Date.now()}.png`;
                    fs.writeFileSync(filename, buffer);
                    
                    // Check if it's actually an image
                    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
                    const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
                    
                    console.log('✅ Image downloaded successfully!');
                    console.log('   Saved as:', filename);
                    console.log('   File size:', (buffer.length / 1024).toFixed(2), 'KB');
                    console.log('   Is valid PNG:', isPNG);
                    console.log('   Is valid JPEG:', isJPEG);
                    
                    if (!isPNG && !isJPEG && buffer.length < 1000) {
                        console.log('   ⚠️ Warning: File appears to be metadata, not image');
                        console.log('   First 200 bytes:', buffer.slice(0, 200).toString());
                    }
                }
            } else {
                console.log('   ⚠️ No image file found in response');
                console.log('   Full response structure:');
                console.log(JSON.stringify(conversationData, null, 2));
            }
        } else {
            console.log('   ⚠️ No outputs in response');
            console.log('   Full response:', JSON.stringify(conversationData, null, 2));
        }

        console.log('');
        console.log('✅ Test completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('   Stack:', error.stack);
    }
}

// Run the test
testImageGeneration();
