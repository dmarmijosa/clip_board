# Clipboard Nexa

Aplicación de portapapeles colaborativo compuesta por un frontend Angular 20 y un backend NestJS con WebSockets y PostgreSQL. Este repositorio contiene ambos proyectos y la infraestructura necesaria para desarrollo local y despliegue en producción mediante Docker y SSH.

## Estructura

- `frontend/`: SPA en Angular que consume la API REST y el gateway WebSocket.
- `backend/`: API NestJS que expone endpoints CRUD, documentación Swagger y eventos en tiempo real.
- `docker-compose.prod.yml`: orquestación de servicios para producción (PostgreSQL, API, frontend y proxy TLS con Caddy).
- `deploy.sh`: script de utilidad para sincronizar el repositorio y lanzar el despliegue remoto a través de SSH.

## Requisitos

- Node.js 20.x y npm para trabajar localmente.
- Docker Engine 24+ y plugin `docker compose` tanto en local (para pruebas) como en el servidor de producción.
- Acceso SSH al servidor que alojará el dominio.
- DNS del dominio apuntando a la IP pública del servidor (registros A/AAAA).

## Configuración local

1. Instala dependencias en cada proyecto:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Levanta el backend con Docker (incluye PostgreSQL):
   ```bash
   cd ../backend
   docker compose up --build -d
   ```
3. Inicia el frontend en modo desarrollo:
   ```bash
   cd ../frontend
   npm start
   ```

## Despliegue vía SSH

1. Crea un archivo `.env.production` en la raíz del repositorio basándote en `.env.production.example` y ajusta:
   - `APP_DOMAIN`: dominio sin protocolo (ej. `clipboard.nexa-code.net`).
   - `LETSENCRYPT_EMAIL`: email para los certificados de Caddy.
   - Credenciales de PostgreSQL (`POSTGRES_*`).
   - Datos de conexión SSH (`SSH_*` y `REMOTE_DIR`).

2. En el servidor remoto (ejecutando una sola vez):
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin rsync
   sudo usermod -aG docker $USER # reinicia sesión si es necesario
   mkdir -p /var/www/clipboard
   ```

3. Desde tu máquina local en la raíz del repo:
   ```bash
   source .env.production
   ./deploy.sh
   ```

   El script realiza lo siguiente:
   - Sincroniza los archivos vía `rsync` excluyendo artefactos locales (`node_modules`, `dist`, etc.).
   - Verifica que `docker` y `docker compose` existan en el servidor.
   - Exporta las variables del `.env.production` remoto.
   - Ejecuta `docker compose -f docker-compose.prod.yml up -d --build` para reconstruir y levantar los servicios.

4. Tras el despliegue, Caddy generará y renovará automáticamente los certificados TLS de Let's Encrypt. Verifica que el dominio cargue correctamente la SPA y que las rutas `/api/*` respondan.

## Servicios en producción

- **Caddy** (`proxy`): termina TLS y enruta el tráfico.
- **Frontend**: Nginx sirviendo el build Angular.
- **Backend**: NestJS ejecutándose con Node.js.
- **PostgreSQL**: base de datos persistida en el volumen `pgdata`.

Para revisar el estado de los contenedores en el servidor:
```bash
ssh $SSH_USER@$SSH_HOST -p $SSH_PORT
cd $REMOTE_DIR
docker compose -f docker-compose.prod.yml ps
```

## Mantenimiento

- **Logs**: `docker compose -f docker-compose.prod.yml logs -f [servicio]`.
- **Actualizaciones**: vuelve a ejecutar `./deploy.sh` tras cambios en el código.
- **Backups**: crea copias del volumen `pgdata` (por ejemplo usando `docker run --rm -v clipboard_pgdata:/var/lib/postgresql/data ...`).

## Licencia

MIT.
