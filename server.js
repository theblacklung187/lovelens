const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

// Load configuration
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket setup
const wss = new WebSocket.Server({ noServer: true });

// Inference API function (batch processing with Hume AI)
async function runInference(modelId, urls = []) {
  try {
    const response = await fetch('https://api.hume.ai/v0/batch/jobs/tl/inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hume-Api-Key': process.env.HUME_API_KEY,
      },
      body: JSON.stringify({
        custom_model: { id: modelId },
        urls: urls,
      }),
    });

    if (!response.ok) {
      throw new Error(`Inference API Error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in runInference:', error);
    throw error;
  }
}

// WebSocket connection logic
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (data) => {
    try {
      const { type, modelId, videoUrl } = JSON.parse(data);

      if (type === 'inference') {
        // Inference API request for pre-recorded videos
        const result = await runInference(modelId, [videoUrl]);
        ws.send(JSON.stringify(result));
      } else if (type === 'stream') {
        // Real-time streaming request to Hume API
        const response = await fetch('https://api.hume.ai/v0/stream/models', {
          method: 'POST',
          headers: {
            'X-Hume-Api-Key': process.env.HUME_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_id: modelId || 'facial-expression',
            video_data: data.toString('base64'), // Ensure Base64 encoding
            config: config // Include the configuration
          }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();
        ws.send(JSON.stringify(result));
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ error: 'Processing failed. Check logs.' }));
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

// Upgrade HTTP to WebSocket connection
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});