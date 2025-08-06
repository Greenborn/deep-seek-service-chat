require("dotenv").config({ path: '.env' })

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');


const app = express();

// WebSocket
const http = require('http');
const WebSocket = require('ws');

const WS_PORT = process.env.WS_PORT || 6790;
const wsServer = new WebSocket.Server({ port: WS_PORT });

// Lógica de procesamiento de chat reutilizable
async function processChat({ userId, message, botName }) {
    if (!userId || !message) {
        return { error: 'Se requieren userId y message' };
    }
    const selectedBot = botName || process.env.DEFAULT_BOT || 'assistant';
    if (!botsConfig[selectedBot]) {
        return { error: `No se encontró configuración para el bot: ${selectedBot}` };
    }
    const contextPrompt = botsConfig[selectedBot].context_prompt;
    try {
        const conversationKey = `${userId}:${selectedBot}`;
        if (!conversations.has(conversationKey)) {
            conversations.set(conversationKey, [
                { role: 'system', content: contextPrompt }
            ]);
        }
        const conversationHistory = conversations.get(conversationKey);
        conversationHistory.push({ role: 'user', content: message });
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: 'deepseek-chat',
                messages: conversationHistory,
                temperature: 0.7,
                max_tokens: Number(process.env.MAX_TOKENS)
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        const botResponse = response.data.choices[0].message.content;
        conversationHistory.push({ role: 'assistant', content: botResponse });
        return { response: botResponse };
    } catch (error) {
        console.error('Error al llamar a DeepSeek API:', error.response?.data || error.message);
        return { error: 'Error al procesar la solicitud' };
    }
}

wsServer.on('connection', (ws) => {
    console.log('Cliente WebSocket conectado');
    ws.on('message', async (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            ws.send(JSON.stringify({ error: 'Formato de mensaje inválido' }));
            return;
        }
        const result = await processChat(data);
        ws.send(JSON.stringify(result));
    });
    ws.on('close', () => {
        console.log('Cliente WebSocket desconectado');
    });
});
console.log('WebSocket server escuchando en:', WS_PORT);

// Configuración de CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (como aplicaciones móviles o Postman)
        if (!origin) return callback(null, true);
        
        // Obtener orígenes permitidos desde variables de entorno
        const allowedOrigins = process.env.CORS_ORIGINS ? 
            process.env.CORS_ORIGINS.split(',') : 
            ['http://localhost:3000', 'http://localhost:5173'];
        
        if (allowedOrigins.indexOf(origin) !==-1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus:200};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Cargar configuración de bots en memoria al iniciar
const botsConfig = {};
const configDir = './configuracion';

try {
    const configFiles = fs.readdirSync(configDir);
    configFiles.forEach(file => {
        if (file.endsWith('.json')) {
            const botName = path.basename(file, '.json');
            const configPath = path.join(configDir, file);
            const configData = fs.readFileSync(configPath, 'utf8');
            const configJson = JSON.parse(configData);
            botsConfig[botName] = configJson;
            console.log(`Bot cargado: ${botName}`);
        }
    });
    console.log(`Total de bots cargados: ${Object.keys(botsConfig).length}`);
} catch (err) {
    console.error(`Error al cargar configuración de bots: ${err}`);
}

// Configuración de DeepSeek
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'; // Verifica la URL actual de la API

// Almacenamiento de conversaciones (en memoria, para producción usa una DB)
const conversations = new Map();

app.post('/api/chat', async (req, res) => {
    const result = await processChat(req.body);
    if (result.error) {
        // Validación de campos o error de negocio
        if (result.error === 'Se requieren userId y message' || result.error.startsWith('No se encontró configuración')) {
            return res.status(400).json(result);
        }
        // Error interno
        return res.status(500).json(result);
    }
    res.json(result);
});

const PORT = process.env.PORT || 3000;
setTimeout(async () => {
    const server = await app.listen(PORT);
    console.log('Servidor escuchando en: ', PORT) 
}, 100)