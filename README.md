# Auralith

Aplicacion web y API para Auralith, una tienda holistica premium peruana.

## Frontend

- Vite + React + TypeScript
- Tailwind CSS v3 + PostCSS
- Framer Motion
- React Router DOM
- Zustand
- Lenis
- GSAP + ScrollTrigger

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

Copia `.env.example` a `.env.local` cuando el API no se ejecute en el puerto
predeterminado.

## Backend

El backend vive en `backend/` y usa NestJS, Fastify, Supabase y PostgreSQL.

```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run admin:bootstrap
npm run start:dev
```

La API local queda disponible en `http://127.0.0.1:3000/api`.
Las credenciales y URLs privadas viven exclusivamente en `backend/.env`.

El backend incluye:

- Supabase Auth para el panel administrativo.
- CRUD de productos, categorias e intenciones.
- Storage de imagenes en el bucket `product-images`.
- Pedidos Web, TikTok y tienda con correlativos separados.
- Stock global transaccional e historial de movimientos.
- Edicion de productos de un pedido con recalculo de total y stock.
- Etiquetas PDF A6 para encomiendas.
- Metricas, contenido publico, FAQs y libro de reclamaciones.

## Fuentes

`src/index.css` importa Poppins desde Google Fonts y declara `The Seasons` con archivos servidos desde `public/fonts`.

Agrega estos archivos antes de revisar la marca visual en navegador:

- `public/fonts/TheSeasons-Regular.woff2`
- `public/fonts/TheSeasons-Regular.woff`
