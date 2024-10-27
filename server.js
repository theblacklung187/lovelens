const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const app = express();

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket setup
const wss = new WebSocket.Server({ noServer: true });

ws.on('message', async (data) => {
  try {
    const response = await fetch('https://api.hume.ai/v0/stream/models', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': process.env.HUME_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'facial-expression',
        video_data: data.toString('base64'), // Encode video data
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();
    ws.send(JSON.stringify(result));
  } catch (error) {
    console.error('Error with Hume API:', error);
    ws.send(JSON.stringify({ error: 'API request failed. Check logs.' }));
  }
});
