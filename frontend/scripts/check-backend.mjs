#!/usr/bin/env node

const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000/api';
const target = `${baseUrl.replace(/\/$/, '')}/health`;

async function main() {
  try {
    const response = await fetch(target);
    if (!response.ok) {
      throw new Error(`Petición fallida (${response.status} ${response.statusText})`);
    }
    const payload = await response.json();
    if (payload?.status !== 'ok') {
      throw new Error(`Respuesta inesperada: ${JSON.stringify(payload)}`);
    }
    console.log('✅ Conexión verificada:', payload);
  } catch (error) {
    console.error('❌ Error verificando la conexión:', error);
    process.exitCode = 1;
  }
}

main();
