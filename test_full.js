// Script de prueba: inicia el servidor y permite probar REST o WebSocket
env = process.env;
require('dotenv').config({ path: '.env' });
const { fork } = require('child_process');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');

const API_URL = `http://localhost:${process.env.PORT || 3000}/api/chat`;
const WS_URL = `ws://localhost:${process.env.WS_PORT || 6790}`;
const SERVER_PATH = path.join(__dirname, 'server.js');


function getBotNameArg() {
  const botFlagIndex = process.argv.indexOf('--bot');
  if (botFlagIndex !== -1 && process.argv.length > botFlagIndex + 1) {
    return process.argv[botFlagIndex + 1];
  }
  return undefined;
}

const testData = {
  userId: 'testuser',
  message: 'Hola, ¿quién eres?',
  botName: getBotNameArg(),
  stream: true
};

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

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
    console.log('[WS] Conexión abierta, enviando mensaje...');
    ws.send(JSON.stringify(testData));
  });
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.chunk) {
        process.stdout.write(msg.chunk);
        console.log(' [WS] Fragmento recibido:', msg.chunk);
      } else if (msg.end) {
        console.log('\n[WS] FIN de respuesta WebSocket');
        ws.close();
      } else if (msg.error) {
        console.error('\n[WS] Error WebSocket:', msg.error);
        ws.close();
      } else {
        console.log('\n[WS] Respuesta WebSocket:', msg);
        ws.close();
      }
    } catch (e) {
      console.log('\n[WS] Respuesta WebSocket (raw):', data.toString());
      ws.close();
    }
  });
  ws.on('error', (err) => {
    console.error('[WS] Error WebSocket:', err.message);
  });
  ws.on('close', () => {
    console.log('[WS] Conexión cerrada');
  });
}

async function main() {
  const modo = process.argv[2];
  if (!['rest', 'ws'].includes(modo)) {
    console.log('Uso: node test_full.js [rest|ws] [--bot nombreBot]');
    return;
  }
  // Inicia el servidor como proceso hijo
  const server = fork(SERVER_PATH, [], { stdio: 'inherit' });
  // Espera a que el servidor esté listo
  await wait(1500);
  if (modo === 'rest') {
    await testRest();
  } else {
    testWebSocket();
    await wait(1500); // Espera a que llegue la respuesta antes de terminar
  }
  server.kill();
}

main();
