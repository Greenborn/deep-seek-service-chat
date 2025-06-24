require("dotenv").config({ path: '.env' })

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Configuración de DeepSeek
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'; // Verifica la URL actual de la API

// Almacenamiento de conversaciones (en memoria, para producción usa una DB)
const conversations = new Map();

app.post('/api/chat', async (req, res) => {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
        return res.status(400).json({ error: 'Se requieren userId y message' });
    }

    console.log("userId", userId, "message", message)

    try {
        // Obtener o crear el historial de conversación
        if (!conversations.has(userId)) {
            conversations.set(userId, [
                {
                    role: 'system',
                    content: 'Eres un asistente útil especializado en asesoramiento personalizado. Responde en español.'
                }
            ]);
        }

        const conversationHistory = conversations.get(userId);
        
        // Agregar el mensaje del usuario al historial
        conversationHistory.push({ role: 'user', content: message });

        // Llamar a la API de DeepSeek
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: 'deepseek-chat', // Verifica el modelo correcto
                messages: conversationHistory,
                temperature: 0.7,
                max_tokens: 1000
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