require("dotenv").config({ path: '.env' })

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Cargar configuración de bots en memoria al iniciar
const botsConfig = {};
const configDir = 'configuracion';

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
    const { userId, message, botName } = req.body;
    
    if (!userId || !message || !botName) {
        return res.status(400).json({ error: 'Se requieren userId, message y botName' });
    }

    console.log("userId", userId, "message", message, "botName", botName)

    // Verificar si el bot existe en la configuración cargada
    if (!botsConfig[botName]) {
        return res.status(400).json({ error: `No se encontró configuración para el bot: ${botName}` });
    }

    const contextPrompt = botsConfig[botName].context_prompt;

    try {
        // Obtener o crear el historial de conversación por usuario y bot
        const conversationKey = `${userId}:${botName}`;
        if (!conversations.has(conversationKey)) {
            conversations.set(conversationKey, [
                {
                    role: 'system',
                    content: contextPrompt
                }
            ]);
        }

        const conversationHistory = conversations.get(conversationKey);
        
        // Agregar el mensaje del usuario al historial
        conversationHistory.push({ role: 'user', content: message });

        // Llamar a la API de DeepSeek
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: 'deepseek-chat', // Verifica el modelo correcto
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
        
        // Agregar la respuesta al historial
        conversationHistory.push({ role: 'assistant', content: botResponse });

        res.json({ response: botResponse });
    } catch (error) {
        console.error('Error al llamar a DeepSeek API:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});