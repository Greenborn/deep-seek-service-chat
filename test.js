// Script de prueba para API REST y WebSocket
require('dotenv').config({ path: '.env' });
const axios = require('axios');
const WebSocket = require('ws');

const API_URL = `http://localhost:${process.env.PORT || 3000}/api/chat`;
const WS_URL = `ws://localhost:${process.env.WS_PORT || 6790}`;

const testData = {
  userId: 'testuser',
  message: 'Hola, ¿quién eres?',
  botName: undefined // o pon un nombre de bot válido si lo tienes
};

async function testRest() {
  try {
    const res = await axios.post(API_URL, testData);
    console.log('Respuesta REST:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Error REST:', err.response.data);
    } else {
      console.error('Error REST:', err.message);
    }
  }
}

function testWebSocket() {
  const ws = new WebSocket(WS_URL);
  ws.on('open', () => {
    ws.send(JSON.stringify(testData));
  });
  ws.on('message', (data) => {
    console.log('Respuesta WebSocket:', data.toString());
    ws.close();
  });
  ws.on('error', (err) => {
    console.error('Error WebSocket:', err.message);
  });
}

async function main() {
  const modo = process.argv[2];
  if (modo === 'rest') {
    await testRest();
  } else if (modo === 'ws') {
    testWebSocket();
  } else {
    console.log('Uso: node test.js [rest|ws]');
  }
}

main();
