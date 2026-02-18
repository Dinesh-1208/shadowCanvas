# ShadowCanvas — Comprehensive Project Documentation

> **ShadowCanvas** is a real-time collaborative canvas application built with a React frontend and a Node.js/Express backend, using MongoDB for persistence and Socket.io for live collaboration.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Backend](#backend)
   - [Server Entry Point](#server-entry-point)
   - [Database Models](#database-models)
   - [Authentication](#authentication)
   - [Canvas API Routes](#canvas-api-routes)
   - [Real-time (Socket.io)](#real-time-socketio)
   - [Utilities](#utilities)
6. [Frontend](#frontend)
   - [Entry Point & Routing](#entry-point--routing)
   - [Auth Feature](#auth-feature)
   - [Canvas Feature](#canvas-feature)
   - [Shared Components & Utilities](#shared-components--utilities)
7. [Environment Variables](#environment-variables)
8. [Getting Started](#getting-started)
9. [CI/CD Pipelines](#cicd-pipelines)

---

## Project Overview

ShadowCanvas lets users create, edit, and collaborate on digital canvases in real time. Key capabilities:

- **Drawing Tools** — Rectangle, Ellipse, Line, Arrow, Freehand, and Text elements
- **Real-time Collaboration** — Multiple users can draw on the same canvas simultaneously using room codes
- **Event Sourcing** — Every drawing action is stored as a discrete event, enabling full replay, undo/redo, and state snapshots
- **Authentication** — Email/password registration, Google OAuth, and GitHub OAuth
- **Password Reset** — OTP-based flow delivered via email
- **Canvas Management** — Users can create, list, rename, delete, and thumbnail their canvases

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  Vite Dev Server · React Router · Tailwind CSS · Framer Motion│
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Landing  │  │  Auth    │  │  Canvas  │  │  My      │     │
│  │  Page    │  │  Pages   │  │  Editor  │  │ Canvases │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│        │              │             │               │        │
│        └──────────────┴─────────────┴───────────────┘        │
│                         │ HTTP (Axios)  │ WebSocket           │
└─────────────────────────┼───────────────┼────────────────────┘
                          │               │
┌─────────────────────────┼───────────────┼────────────────────┐
│                     Backend (Express)                         │
│                          │               │                    │
│  ┌──────────────────┐   │   ┌───────────┐                    │
│  │  Auth Routes     │◄──┘   │ Socket.io │                    │
│  │  Canvas Routes   │       │  Server   │                    │
│  └────────┬─────────┘       └───────────┘                    │
│           │                                                   │
│  ┌────────▼─────────┐                                         │
│  │    MongoDB        │                                        │
│  │  (Mongoose ODM)   │                                        │
│  └──────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | — | Runtime |
| Express | 5.x | HTTP framework |
| Mongoose | 9.x | MongoDB ODM |
| Socket.io | 4.x | Real-time WebSocket server |
| Passport.js | 0.7 | OAuth strategies (Google, GitHub) |
| jsonwebtoken | 9.x | JWT creation & verification |
| bcryptjs | 3.x | Password hashing |
| nodemailer | 8.x | Email delivery (OTP) |
| dotenv | — | Environment variables |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI library |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 4.x | Utility-first CSS |
| Framer Motion | 12.x | Animations & drag interactions |
| React Router | 7.x | Client-side routing |
| Socket.io-client | 4.x | Real-time WebSocket client |
| Axios | 1.x | HTTP requests |
| Lucide React | — | Icon library |
| uuid | 13.x | Unique ID generation |
| class-variance-authority | — | Component variant management |

---


## Backend

### Server Entry Point

**File:** `backend/src/index.js`

Sets up the Express application with:
- **JSON body parsing** — 50 MB limit (to support Base64 thumbnail uploads)
- **CORS** — Allows `localhost:5173` and `localhost:5174` with credentials
- **Passport initialization** — Loads Google and GitHub OAuth strategies
- **Request logging** — Logs every incoming request method and URL
- **MongoDB connection** — Connects via `MONGO_URI` env var (falls back to `localhost:27017`)
- **Route mounting** — Auth at `/auth`, Canvas API at `/api/canvas`
- **Socket.io** — HTTP server wrapped and passed to `initSocket()`

---

### Database Models

#### 1. User (`User.model.js`)
| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Required, unique |
| `password` | String | Required (bcrypt hash) |
| `createdAt` | Date | Auto |

#### 2. Canvas (`Canvas.model.js`)
| Field | Type | Notes |
|---|---|---|
| `ownerId` | Mixed | ObjectId or `'single-user'` for unauthenticated use |
| `title` | String | Default: `"Untitled Canvas"` |
| `thumbnail` | String | Base64 data URL |
| `roomCode` | String | Required, unique, uppercase |
| `createdAt` | Date | Auto (timestamps) |
| `updatedAt` | Date | Auto (timestamps) |

#### 3. CanvasEvent (`CanvasEvent.model.js`)
Stores individual drawing operations for event sourcing.

| Field | Type | Notes |
|---|---|---|
| `canvasId` | ObjectId | Ref → Canvas, indexed |
| `userId` | String | Ref → User or `'single-user'` |
| `eventType` | String | Enum: `ADD_ELEMENT`, `UPDATE_ELEMENT`, `DELETE_ELEMENT`, `MOVE_ELEMENT`, `RESIZE_ELEMENT`, `REORDER_ELEMENT`, `CLEAR_CANVAS` |
| `eventData` | Mixed | Event payload (element data, deltas, etc.) |
| `timestamp` | Date | Manual |
| `eventOrder` | Number | Required, compound indexed with `canvasId` |

#### 4. CanvasState (`CanvasState.model.js`)
Periodic snapshots of the full canvas state for fast loading.

| Field | Type | Notes |
|---|---|---|
| `canvasId` | ObjectId | Ref → Canvas |
| `elements` | Array | Full element list at snapshot time |
| `lastEventOrder` | Number | Event order this snapshot represents |
| `createdAt` | Date | Auto |

#### 5. CanvasAccess (`CanvasAccess.model.js`)
Role-based access control for shared canvases.

| Field | Type | Notes |
|---|---|---|
| `canvasId` | ObjectId | Ref → Canvas |
| `userId` | ObjectId | Ref → User |
| `role` | String | Enum: `VIEW`, `EDIT` (default: `VIEW`) |
| `createdAt` | Date | Auto |

> Compound unique index on `(canvasId, userId)`.

#### 6. PasswordResetToken (`PasswordResetToken.model.js`)
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref → User |
| `token` | String | Bcrypt-hashed OTP |
| `createdAt` | Date | TTL: expires after 3600 seconds (1 hour) |

---

### Authentication

#### Auth Routes (`/auth`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/register` | `register` | — | Create account with name, email, password |
| POST | `/login` | `login` | — | Login with email/password, returns JWT |
| POST | `/forgot-password` | `forgotPassword` | — | Sends 6-digit OTP to email |
| POST | `/verify-otp` | `verifyOtp` | — | Validates the OTP |
| POST | `/reset-password` | `resetPassword` | — | Resets password after OTP verification |
| GET | `/google` | Passport | — | Initiates Google OAuth flow |
| GET | `/google/callback` | `oauthCallback` | — | Google OAuth callback → JWT redirect |
| GET | `/github` | Passport | — | Initiates GitHub OAuth flow |
| GET | `/github/callback` | `oauthCallback` | — | GitHub OAuth callback → JWT redirect |

#### Auth Flow
1. **Registration:** Validates fields → checks for existing user → hashes password with bcrypt (salt 10) → creates user → returns JWT (7-day expiry)
2. **Login:** Finds user by email → compares bcrypt hash → returns JWT
3. **OAuth:** Passport strategy finds or creates user → generates JWT → redirects to frontend with token as query param
4. **Password Reset:** `forgotPassword` generates 6-digit OTP → hashes and stores it → emails it via Nodemailer. `verifyOtp` validates. `resetPassword` changes the password.

#### Protect Middleware (`auth.middleware.js`)
Extracts `Bearer <token>` from `Authorization` header → verifies JWT → attaches `req.user` (without password field). Used on protected routes like `user-canvases` and `DELETE /canvas/:id`.

---

### Canvas API Routes

**Base Path:** `/api/canvas`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create` | — | Create a new canvas with title and roomCode |
| GET | `/user-canvases` | `protect` | Get all canvases owned by the logged-in user |
| POST | `/snapshot` | — | Save a full-state snapshot of a canvas |
| GET | `/snapshot/latest?canvasId=` | — | Get the latest snapshot for a canvas |
| POST | `/event` | — | Save a single drawing event |
| GET | `/room/:roomCode` | — | Find a canvas by its room code |
| GET | `/:id/events` | — | Load canvas metadata + latest snapshot + events since snapshot |
| PUT | `/:id` | — | Update canvas metadata (title, thumbnail) |
| DELETE | `/:id` | `protect` | Delete a canvas (owner-only) |

#### Event Sourcing Pattern
The canvas uses an **event sourcing** architecture:
1. Every drawing action (add, move, resize, delete, reorder, clear) is stored as a `CanvasEvent`
2. Periodically, a `CanvasState` snapshot is saved with the full element array
3. To load a canvas: fetch the latest snapshot → replay only the events **after** the snapshot's `lastEventOrder`
4. This enables undo/redo on the client side and efficient loading

---

### Real-time (Socket.io)

**File:** `backend/src/socket.js`

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join-room` | Client → Server | `roomCode` | Joins a normalized (uppercase) room |
| `canvas-update` | Client → Server | `{ roomCode, eventType, eventData }` | Broadcasts drawing update to room |
| `canvas-update` | Server → Clients | `{ eventType, eventData, senderId }` | Received by all other clients in the room |
| `disconnect` | Auto | — | Logged on server |

Room codes are normalized to uppercase for consistency.

---

### Utilities

#### `sendEmail.js`
Wraps Nodemailer with Gmail SMTP transport. Accepts `{ email, subject, message }` and sends HTML email using `EMAIL_USER` and `EMAIL_PASS` environment variables.

---

## Frontend

### Entry Point & Routing

**`main.jsx`** renders the React app into `#root` inside a `BrowserRouter`.

**`App.jsx`** defines all routes:

| Path | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Marketing home page |
| `/login` | `Login` | Login form |
| `/register` | `Register` | Registration form |
| `/forgot-password` | `ForgotPassword` | Request OTP |
| `/reset-password` | `ResetPassword` | Enter OTP + new password |
| `/profile` | `Profile` | User profile page |
| `/my-canvases` | `MyCanvases` | User's canvas dashboard |
| `/canvas/:roomCode` | `CanvasPage` | Canvas editor (by room code) |
| `/canvas` | `RandomRedirect` | Generates random room code and redirects |
| `*` | `Navigate → /` | Catch-all redirect |

The `RandomRedirect` component uses `useEffect` to generate a room code client-side (avoiding impure render calls), then does a `<Navigate>` redirect.

---

### Auth Feature

Located in `features/auth/`.

#### Components
- **`AuthCard.jsx`** — Reusable card wrapper for auth forms with consistent styling

#### Pages
| Page | Purpose |
|---|---|
| `Login.jsx` | Email/password login form + OAuth buttons. Stores JWT to `localStorage` |
| `Register.jsx` | Registration form with name, email, password |
| `ForgotPassword.jsx` | Email input → sends OTP request to backend |
| `ResetPassword.jsx` | OTP verification → new password form |
| `Profile.jsx` | Displays user profile info |

---

### Canvas Feature

Located in `features/canvas/`. This is the core of the application.

#### Components

##### `Canvas.jsx` (483 lines)
The core rendering and interaction component. Handles:
- SVG-based canvas rendering with zoom/pan transforms
- Pointer events for drawing, selecting, moving, and resizing elements
- Element creation for rectangles, ellipses, lines, arrows, freehand paths, and text
- Multi-element selection
- Resize handles (8 directional)
- Grid rendering

##### `CanvasPage.jsx`
Full-page layout wrapper using a 3-column grid:
- Left: Properties panel
- Center: Canvas + Toolbar (centered)
- Right: (reserved)
- Top: Canvas header with title and navigation

##### `CanvasHeader.jsx`
Top bar containing:
- ShadowCanvas logo
- Editable canvas title (inline editing)
- "Back to My Canvases" navigation button
- Menu button

##### `Toolbar.jsx`
Draggable floating toolbar (via `framer-motion`) with:
- Drawing tools: Select, Rectangle, Ellipse, Line, Arrow, Freehand, Text, Eraser
- Actions: Undo, Redo, Clear Canvas
- Zoom controls: Zoom In, Zoom Out, Reset
- Active tool highlighting

##### `PropertiesPanel.jsx`
Right-side panel for editing selected element properties:
- Stroke color, fill color
- Stroke width, stroke style (solid, dashed, dotted)
- Opacity slider
- Roughness (for hand-drawn effects)
- Edge style (sharp, round)
- Font size, font family, text alignment (for text elements)
- Arrow end style (for arrows)

##### `Elements.jsx`
Renders individual SVG elements based on their type and properties.

#### Hook: `useCanvas.js` (565 lines)
The central state management hook. Manages **all** canvas state and operations:

**State:**
- `elements` — Array of all canvas elements
- `selectedId` — Currently selected element ID
- `tool` — Active drawing tool
- `canvasId` — Backend canvas ID
- `canvasTitle` — Editable title
- `zoom` / `panOffset` — View transform state
- Style states (strokeColor, fillColor, strokeWidth, etc.)
- Undo/redo history stacks

**Key Functions:**

| Function | Description |
|---|---|
| `setupCanvas()` | Initializes or loads canvas from backend by room code |
| `initNewCanvas(name, rCode)` | Creates a new canvas via API |
| `loadCanvasFromBackend(cid)` | Loads canvas state from snapshot + event replay |
| `replayEvents(events, initialElements)` | Replays event log to reconstruct state |
| `addElement(el)` | Adds element + persists `ADD_ELEMENT` event |
| `updateElement(id, updates)` | Updates element + persists `UPDATE_ELEMENT` event |
| `deleteElement(id)` | Removes element + persists `DELETE_ELEMENT` event |
| `moveElement(id, dx, dy)` | Moves element (optimistic, batched persistence) |
| `commitMove(id)` | Persists final move as `MOVE_ELEMENT` event |
| `resizeElement(id, updates)` | Resizes element (optimistic) |
| `commitResize(id)` | Persists final resize as `RESIZE_ELEMENT` event |
| `reorderElement(id, direction)` | Changes z-order + persists |
| `undo()` / `redo()` | Navigate history stack |
| `clearCanvas()` | Clears all elements + persists `CLEAR_CANVAS` |
| `persistEvent(type, data)` | Debounced event persistence (600ms batching) |
| `flushEvents()` | Immediately sends pending events + saves snapshot |
| `setCanvasTitle(title)` | Updates title via API |
| `updateThumbnail(thumbnail)` | Saves thumbnail via API |
| Zoom: `zoomIn()`, `zoomOut()`, `resetZoom()` | View controls |

**Socket.io Integration:**
- Connects to `localhost:5000` on mount
- Joins room by `roomCode` on canvas setup
- Emits `canvas-update` on every local drawing action
- Listens for `canvas-update` from other clients and replays their events locally

**Event Batching:**
Uses a 600ms debounce (`BATCH_DELAY`) to batch rapid drawing events before persisting to the backend, reducing API calls during fast interactions.

#### Pages

| Page | Purpose |
|---|---|
| `MultiCanvasLobby.jsx` | Lobby for creating or joining canvas sessions |
| `MultiCanvasJoin.jsx` | Form to enter a room code and join |
| `MultiCanvasInitialization.jsx` | Canvas creation form |
| `MyCanvases.jsx` | Dashboard listing all user canvases with thumbnails |

#### Utilities

- **`geometry.js`** — Math helpers for shape calculations (bounding boxes, intersections, etc.)
- **`thumbnail.js`** — Generates canvas preview thumbnails from SVG elements

---

### Shared Components & Utilities

#### UI Components (`components/ui/`)
Primitive, reusable components built with `class-variance-authority` for variant management:
- **`button.jsx`** — Button with variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` and sizes: `default`, `sm`, `lg`, `icon`
- **`input.jsx`** — Styled input field
- **`label.jsx`** — Form label
- **`separator.jsx`** — Visual divider
- **`slider.jsx`** — Range slider

#### Layout Components
- **`Navbar.jsx`** — Navigation bar
- **`Footer.jsx`** — Page footer

#### Utilities
| File | Purpose |
|---|---|
| `lib/utils.js` | `cn()` — Merges Tailwind classes using `clsx` + `tailwind-merge` |
| `utils/api.js` | All canvas API wrappers (see [Canvas API Routes](#canvas-api-routes)) |
| `utils/formatDate.js` | Date formatting helpers |
| `services/authService.js` | Auth API call wrappers |

---

## Environment Variables

Create a `.env` file in `backend/`:

```env
# Server
PORT=5000

# Database
MONGO_URI=mongodb://127.0.0.1:27017/shadowCanvas

# JWT
JWT_SECRET=your_jwt_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (running locally or a cloud instance)

### Backend Setup
```bash
cd backend
npm install
# Configure .env (see Environment Variables section)
npm run dev
# Server starts on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App opens on http://localhost:5173
```

### Quick Start
1. Start MongoDB
2. Start the backend (`npm run dev` in `backend/`)
3. Start the frontend (`npm run dev` in `frontend/`)
4. Open `http://localhost:5173` in your browser
5. Register an account or click "Create Canvas" to start drawing

---

## CI/CD Pipelines

### Frontend CI (`.github/workflows/frontend-ci.yml`)
Triggers on push/PR to `main`:
1. Installs dependencies
2. Runs `npm run lint` (ESLint)
3. Runs `npm run build` (Vite production build)
4. Placeholder: Deploy step

### Backend CI (`.github/workflows/backend-ci.yml`)
Triggers on push/PR to `main`:
1. Installs dependencies
2. Validates syntax
3. Placeholder: Test and deploy steps

> **Note:** Test suites and deployment steps are placeholders and require further implementation.


