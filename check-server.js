#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico del servidor deep-seek-service-chat\n');

// Verificar archivo .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ Archivo .env encontrado');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasApiKey = envContent.includes('DEEPSEEK_API_KEY');
    const hasPort = envContent.includes('PORT');
    console.log(`   - API Key configurada: ${hasApiKey ? '✅' : '❌'}`);
    console.log(`   - Puerto configurado: ${hasPort ? '✅' : '❌'}`);
} else {
    console.log('❌ Archivo .env NO encontrado');
    console.log('   Crea un archivo .env con las siguientes variables:');
    console.log('   DEEPSEEK_API_KEY=tu_api_key');
    console.log('   PORT=6789');
    console.log('   MAX_TOKENS=1024');
    console.log('   DEFAULT_BOT=assistant');
}

// Verificar dependencias
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
    console.log('\n✅ package.json encontrado');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`   - Versión: ${packageJson.version}`);
    console.log(`   - Dependencias: ${Object.keys(packageJson.dependencies || {}).length}`);
} else {
    console.log('\n❌ package.json NO encontrado');
}

// Verificar node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
    console.log('\n✅ node_modules encontrado');
    const requiredDeps = ['express', 'axios', 'dotenv', 'cors', 'body-parser'];
    const missingDeps = [];
    
    requiredDeps.forEach(dep => {
        const depPath = path.join(nodeModulesPath, dep);
        if (!fs.existsSync(depPath)) {
            missingDeps.push(dep);
        }
    });
    
    if (missingDeps.length === 0) {
        console.log('   - Todas las dependencias están instaladas');
    } else {
        console.log(`   - Dependencias faltantes: ${missingDeps.join(', ')}`);
        console.log('   Ejecuta: npm install');
    }
} else {
    console.log('\n❌ node_modules NO encontrado');
    console.log('   Ejecuta: npm install');
}

// Verificar archivos de configuración
const configDir = path.join(__dirname, 'configuracion');
if (fs.existsSync(configDir)) {
    console.log('\n✅ Directorio de configuración encontrado');
    const configFiles = fs.readdirSync(configDir).filter(file => file.endsWith('.json'));
    console.log(`   - Archivos de configuración: ${configFiles.length}`);
    configFiles.forEach(file => {
        console.log(`     - ${file}`);
    });
} else {
    console.log('\n❌ Directorio de configuración NO encontrado');
}

// Verificar server.js
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
    console.log('\n✅ server.js encontrado');
    const stats = fs.statSync(serverPath);
    console.log(`   - Tamaño: ${stats.size} bytes`);
} else {
    console.log('\n❌ server.js NO encontrado');
}

console.log('\n📋 Resumen de acciones recomendadas:');
console.log('1. Si falta .env: Crea el archivo con las variables necesarias');
console.log('2. Si faltan dependencias: npm install');
console.log('3. Para iniciar el servidor: npm start');
console.log('4. Para desarrollo: npm run dev (requiere nodemon)'); 