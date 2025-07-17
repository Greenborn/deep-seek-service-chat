# Arquitectura del Proyecto deep-seek-service-chat

## Resumen General
Este proyecto es un servicio backend Node.js que expone una API REST para chat conversacional usando la API de DeepSeek. Permite gestionar múltiples conversaciones en paralelo, manteniendo el contexto en memoria para cada usuario y permitiendo seleccionar entre múltiples bots configurables.

## Estructura de Carpetas

```
deep-seek-service-chat/
├── server.js            # Lógica principal del servidor Express y API REST
├── package.json         # Dependencias y metadatos del proyecto
├── package-lock.json    # Versionado exacto de dependencias
├── promt_config.txt     # (Obsoleto, usar configuracion/*.json)
├── .env                 # Variables de entorno (no versionado, recomendado)
├── .gitignore           # Exclusiones de git
├── node_modules/        # Dependencias instaladas
├── configuracion/       # Configuración de prompts para cada bot (archivos .json)
│   ├── assistant.json   # Prompt del bot "assistant"
│   ├── soporte.json     # Prompt del bot "soporte"
│   └── ventas.json      # Prompt del bot "ventas"
└── documentacion/
    └── arquitectura.md  # (Este archivo)
```

## Dependencias Clave
- **express**: Framework web para Node.js, maneja rutas y servidor HTTP.
- **body-parser**: Middleware para parsear JSON en peticiones.
- **axios**: Cliente HTTP para consumir la API de DeepSeek.
- **dotenv**: Carga variables de entorno desde un archivo `.env`.
- **fs**: Acceso a archivos para cargar configuración de bots.

## Flujo de Funcionamiento
1. **Inicialización**: Se cargan las variables de entorno y se prepara el servidor Express.
2. **API REST**: El endpoint principal es `POST /api/chat`, que recibe `userId`, `message` y `botName`.
3. **Gestión de Conversaciones**: Se mantiene un historial en memoria (por usuario y bot) para preservar el contexto conversacional.
4. **Carga de Prompt**: El prompt de contexto se carga dinámicamente desde `configuracion/{botName}.json`.
5. **Llamada a DeepSeek**: Se envía el historial a la API de DeepSeek y se recibe la respuesta del modelo.
6. **Respuesta**: Se retorna la respuesta del asistente y se actualiza el historial.

## Variables de Entorno Sugeridas (`.env`)
```env
DEEPSEEK_API_KEY=tu_api_key
MAX_TOKENS=1024
PORT=3000
```

## Diagrama de Flujo
```mermaid
graph TD;
  Cliente -->|POST /api/chat (userId, message, botName)| Servidor_Express
  Servidor_Express -->|userId, botName, message| Memoria_Conversaciones
  Servidor_Express -->|Historial + prompt dinámico| DeepSeek_API
  DeepSeek_API -->|Respuesta| Servidor_Express
  Servidor_Express -->|Respuesta JSON| Cliente
```

## Notas y Recomendaciones
- **Persistencia**: Actualmente el historial se almacena en memoria. Para producción, se recomienda usar una base de datos.
- **Seguridad**: No exponer la API Key en el código ni en repositorios públicos.
- **Escalabilidad**: El almacenamiento en memoria limita la escalabilidad horizontal.
- **Multi-bot**: Para agregar un nuevo bot, crea un archivo JSON en la carpeta `configuracion` con la clave `context_prompt`.

---

> Para detalles adicionales, revisar `server.js` y la configuración en `package.json`. 