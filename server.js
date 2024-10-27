const WebSocket = require('ws');
const express = require('express');
const fetch = require('node-fetch');
const app = express();

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ noServer: true });

// WebSocket logic
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (data) => {
    const response = await fetch('https://api.hume.ai/v0/stream/models', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': process.env.HUME_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model_id: 'facial-expression', video_data: data }),
    });
    const result = await response.json();
    ws.send(JSON.stringify(result));
  });

  ws.on('close', () => console.log('Client disconnected'));
});

// Handle server upgrades for WebSocket
const server = app.listen(PORT, () => console.log(`Server running on ${PORT}`));
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
