# Torneito-app

Aplicación de escritorio para organizar torneos de fútbol entre amigos: jugadores, fixtures, resultados, estadísticas, cromos y modo TV.

Construida con **Electron**, **React**, **TypeScript** y **SQLite** (local, sin servidor).

## Características

- **Jugadores** — perfiles con foto, nickname y equipo
- **Torneos** — formatos: todos contra todos, playoffs, grupos + eliminatoria, solo eliminatoria
- **Partidos y resultados** — fixture automático, tablas, fases y cuadros
- **Estadísticas** — ranking histórico, cara a cara, rachas y premios por torneo
- **Resumen del torneo** — narrativa automática al finalizar
- **Cromos** — álbum exportable en PNG con tiers por rendimiento
- **Modo TV** — pantalla completa para proyectar un torneo en vivo
- **Idiomas** — español (por defecto) e inglés
- **Configuración** — cambio de idioma y borrado total de datos

## Stack

| Capa | Tecnología |
|------|------------|
| Desktop | Electron 36 |
| UI | React 19, React Router |
| i18n | i18next, react-i18next |
| Base de datos | better-sqlite3 (WAL) |
| Build | electron-vite, electron-builder |
| Tests | Vitest |

## Requisitos

- **Node.js** 20+ (recomendado LTS)
- **npm** 10+
- macOS, Windows o Linux para desarrollo
- Para empaquetar en Windows de forma confiable: máquina Windows o CI (`windows-latest`)

## Instalación

```bash
git clone <url-del-repo>
cd MundialApp
npm install
```

`postinstall` recompila `better-sqlite3` para Electron automáticamente.

## Desarrollo

```bash
npm run dev
```

### Si aparece error de `better-sqlite3`

Después de correr tests (`npm test`) o `rebuild:native:node`, reconstruí el módulo nativo para Electron antes de abrir la app:

```bash
npm run rebuild:native
npm run dev
```

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | App en modo desarrollo |
| `npm run build` | Compila a `out/` |
| `npm run package:mac` | Instalador `.dmg` / `.zip` (macOS) |
| `npm run package:win` | Instalador `.exe` NSIS (Windows) |
| `npm run package:dir` | Build sin instalador (prueba rápida) |
| `npm run test` | Tests unitarios |
| `npm run typecheck` | Verificación TypeScript |
| `npm run rebuild:native` | Rebuild de SQLite para Electron |

Los instaladores se generan en `release/` con el nombre **Torneito-app**.

## Estructura del proyecto

```
src/
├── main/           # Proceso principal Electron, IPC, ventanas
├── preload/        # Puente seguro renderer ↔ main
├── renderer/       # UI React (páginas, componentes, estilos)
├── shared/         # Tipos, IPC, validación, i18n
├── database/       # SQLite, migraciones
└── modules/        # Lógica de negocio (jugadores, torneos, partidos…)
```

## Datos locales

La app guarda todo en la carpeta `userData` de Electron:

- `mundial.db` — base de datos SQLite
- `photos/` — fotos de jugadores
- `stickers/` — cromos exportados
- `preferences.json` — idioma y preferencias

No hay sincronización en la nube: los datos viven solo en tu computadora.

## Arquitectura

- **Renderer** — React consume la API vía `window.api` (preload + IPC)
- **Main** — servicios, repositorios y SQLite en el proceso principal
- **Shared** — tipos y traducciones compartidos entre procesos

Flujo típico: UI → IPC → servicio → repositorio → SQLite.

## Idioma

En **Configuración** podés elegir **Español** o **English**. La preferencia se persiste en `preferences.json`.

## Licencia

MIT — ver `package.json`.
