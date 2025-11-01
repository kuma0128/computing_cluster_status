# Computing Cluster Status Monitor - Modern Frontend

This is the modern Vite + React + TypeScript version of the cluster status monitor frontend.

## Features

- ⚛️ React 18 with TypeScript
- ⚡ Vite for fast development and optimized builds
- 📊 D3.js for data visualization
- 🎨 Modern, responsive UI
- 🔄 Real-time data updates
- 📱 Mobile-friendly design

## Development

```bash
# Install dependencies
npm install

# Start development server (with API proxy)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint
```

## Architecture

```
src/
├── api/              # API client layer
│   └── ClusterAPI.ts
├── components/       # React components
│   ├── charts/      # Chart components
│   │   ├── BaseChart.tsx
│   │   ├── PerUserBreakdownChart.tsx
│   │   └── DiskHeatmapChart.tsx
│   └── Dashboard.tsx
├── types/           # TypeScript type definitions
│   └── index.ts
├── App.tsx          # Main application component
└── main.tsx         # Application entry point
```

## Integration with Backend

The Vite dev server proxies API requests to the PHP backend:
- Development: `http://localhost:3000` → API at `http://localhost:8080/api`
- Production: Built files served from `php/dist/`

## Environment

- Node.js >= 18
- React 18
- TypeScript 5
- Vite 5
- D3.js 7

## Building for Production

```bash
npm run build
```

This builds the application to `../../php/dist/` which can be served by the PHP backend.

## Migration Path

This modern frontend coexists with the classic build-free version:
- Classic: `js/` directory (ES6 modules, no build step)
- Modern: `frontend/modern/` (Vite/React/TypeScript)

Choose the version that best fits your needs!
