# RN Expo Real-Time Tasks — Rashmi Jayawardhana

## Overview

A real-time collaborative messaging application built with React Native (Expo) and Node.js. Users can log, send messages, and see updates from other users instantly through WebSocket connections. The app features push notifications, offline queue management, and additional screens for enhanced user experience.

## Demo Links

- **Video Walkthrough**: 
- **Live Expo App**: https://expo.dev/preview/update?message=Updated+app.json+details+and+icons&updateRuntimeVersion=1.0.0&createdAt=2025-11-01T15%3A13%3A41.469Z&slug=exp&projectId=4e36dfea-2cbf-46ba-86fb-69db3318fa1e&group=fb130071-63a6-464e-a314-74dbf16c867d
- **Backend API**: http://13.60.226.207:3000  (AWS EC2 Deployment)

## Tech Stack

**Frontend:**
- React Native with Expo SDK 54
- TypeScript for type safety
- Redux Toolkit for state management
- Socket.IO Client for WebSocket connections
- Expo Notifications for push notifications
- AsyncStorage for local data persistence

**Backend:**
- Node.js with Express.js
- TypeScript
- Socket.IO for real-time communication
- MySQL 8.0 with connection pooling
- Expo Push Notification service integration

**Testing:**
- Jest for unit testing
- React Native Testing Library
- Supertest for API integration tests

## Features Implemented

### Must-Have Features 
- ✅ **Login Screen**: User can enter a display name (persisted locally with AsyncStorage)
- ✅ **Main Screen**: Shows list of messages using FlatList with author name, text, and timestamp
- ✅ **Pull-to-Refresh**: Refresh button to re-fetch messages
- ✅ **Create Message**: Input field with sending loader while POSTing
- ✅ **Real-Time Updates**: Backend emits events when new items created; all connected clients update Redux state and UI instantly via WebSocket
- ✅ **Loading States & Offline Handling**: Shows ActivityIndicator during initial fetch, send, and refresh. Handles network errors gracefully with alerts
- ✅ **TypeScript**: Used throughout frontend and backend with proper types/interfaces
- ✅ **Redux**: App state management (user info, messages list, loading states)
- ✅ **MySQL Persistence**: All users and messages persisted in database
- ✅ **Automated Tests**: Jest tests for both frontend (10 tests) and backend (15 tests)
- ✅ **Documentation**: Complete README with setup instructions, design notes, and timeline

### Bonus Features 
- ✅ **Push Notifications**: Expo push notifications when new messages arrive
- ✅ **Offline Message Queue**: Ready for integration (messages cached and synced when back online)
- ✅ **Optimistic UI**: Messages appear immediately in sender's UI
- ✅ **Socket Reconnection**: Automatic handling with backoff
- ✅ **Extra Screens**: Settings screen, Users List with search, Message Details with copy/share/delete
- ✅ **Test Coverage**: >50% coverage for multiple modules

## Project Structure
```
├── app/                          # React Native frontend
│   ├── src/
│   │   ├── screens/             # Screen components
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── MainScreen.tsx
│   │   │   ├── SettingsScreen.tsx
│   │   │   ├── UsersListScreen.tsx
│   │   │   ├── MessageDetailsScreen.tsx
│   │   │   └── __tests__/       # Frontend tests
│   │   │       └── MainScreen.test.tsx
│   │   ├── store/               # Redux setup
│   │   │   ├── index.ts
│   │   │   └── messagesSlice.ts
│   │   ├── services/            # API, Socket, Storage, Notifications
│   │   │   ├── api.ts
│   │   │   ├── socket.ts
│   │   │   ├── storage.ts
│   │   │   ├── notifications.ts
│   │   │   └── offlineQueue.ts
│   │   └── types/               # TypeScript definitions
│   │       ├── index.ts
│   │       └── navigation.ts
│   ├── types/                   # TypeScript declarations (root level)
│   │   ├── env.d.ts
│   │   └── nativewind.d.ts
│   ├── App.tsx                  # Root component
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── metro.config.js
│   ├── jest.config.js
│   ├── jest.setup.js
│   ├── babel.config.js
│   ├── app.json
│   ├── index.js
│   └── .env.example
│
├── server/                       # Node.js backend
│   ├── src/
│   │   ├── server.ts            # Main server with REST + WebSocket
│   │   ├── db.ts                # MySQL connection pool
│   │   ├── types.ts             # TypeScript interfaces
│   │   └── server.test.ts       # Backend API tests
│   ├── schema.sql               # Database schema
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   
│
└── README.md                     # This file
```

## Setup Instructions

### Prerequisites

Ensure you have the following installed:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/))
- **Expo CLI**: `npm install -g expo-cli`
- **Git** ([Download](https://git-scm.com/))
- iOS Simulator (Mac) or Android Emulator

### 1. Clone the Repository

```bash
git clone https://github.com/rashmiJayawardhana/Real-Time_Tasks_App.git
cd Real-Time_Tasks_App
```

### 2. Database Setup

```bash
# Start MySQL server (if not already running)
# On Mac: brew services start mysql
# On Windows: Start MySQL service from Services

# Log into MySQL
mysql -u root -p

# Create database
CREATE DATABASE rn_takehome;
USE rn_takehome;

# Run schema file from project root
SOURCE server/schema.sql;

# Verify tables were created
SHOW TABLES;
# Should show: users, messages, push_tokens

# Check sample data
SELECT * FROM users;
SELECT * FROM messages;

# Exit MySQL
exit;
```

### 3. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file 
# PORT=3000
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_mysql_password
# DB_NAME=rn_takehome
# DB_PORT=3306

# Edit .env with your MySQL credentials
# nano .env  (or use your preferred editor)

# Run tests to verify setup
npm test

# Start development server
npm run dev

# Expected output:
# MySQL pool connected successfully
# Server running on port 3000
# Push notifications enabled
```

**Verify backend is running:**
```bash
# In a new terminal
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

### 4. Frontend Setup


```bash
# Open a new terminal window
cd app

# Install dependencies
npm install

# IMPORTANT: Configure API URL
# Find your local IP address:
# Mac: ifconfig | grep "inet " | grep -v 127.0.0.1
# Windows: ipconfig (look for IPv4 Address)
# Linux: hostname -I

# Create .env file
cp .env.example .env

# Edit .env
nano .env
```

**Configure .env for development:**
```env
API_URL=http://YOUR_LOCAL_IP:3000
SOCKET_URL=http://YOUR_LOCAL_IP:3000
```

Example:
```env
API_URL=http://192.168.1.100:3000
SOCKET_URL=http://192.168.1.100:3000
```

```bash
# Run tests
npm test

# Start Expo development server
npx expo start -c

# Options:
# Press 'i' for iOS simulator (Mac only)
# Press 'a' for Android emulator
# Scan QR code with Expo Go app on physical device
```

### 5. Testing Real-Time Features

**To verify WebSocket functionality:**

1. **Open the app on two devices simultaneously:**
   - Option A: iOS Simulator + Android Emulator
   - Option B: Two physical devices with Expo Go
   - Option C: One device + one simulator

2. **Login with different usernames** on each device
   - Device 1: "Rashmi"
   - Device 2: "Rasini"

3. **Send a message** from Device 1 

4. **Verify instant update** on Device 2 - the message should appear immediately without refresh

5. **Test bidirectional communication** - send from Device 2 and verify on Device 1

## Running Tests

### Backend Tests
```bash
cd server
npm test

# Expected output: 15 tests passing
# Tests cover: API endpoints, validation, error handling, database operations
```

### Frontend Tests
```bash
cd app
npm test

# Expected output: 10 tests passing
# Tests cover: rendering, user interactions, state management, navigation
```

## API Documentation

### REST Endpoints

**Users:**
- `POST /api/users` - Create or get user by name
  - Body: `{ "name": "string" }`
  - Returns: `User` object
- `GET /api/users` - Get all users with message counts
- `GET /api/users/:id` - Get specific user
- `GET /api/users/:id/messages` - Get messages by user

**Messages:**
- `GET /api/messages?limit=50` - Get latest messages
- `POST /api/messages` - Create new message
  - Body: `{ "user_id": number, "text": "string" }`
  - Returns: `Message` object
  - Broadcasts to all connected clients via WebSocket

**Push Tokens:**
- `POST /api/push-tokens` - Register push notification token
- `DELETE /api/push-tokens/:token` - Remove token on logout

### WebSocket Events

**Client → Server:**
- `client:join` - Join with user info: `{userId, userName}`

**Server → Client:**
- `message:new` - New message broadcast: `{id, user_id, text, created_at, user_name}`

**Connection Events:**
- `connect` - Successfully connected
- `disconnect` - Disconnected from server

## Architecture & Design Decisions

### 1. Hybrid REST + WebSocket Architecture

**Decision:** Use REST API for mutations and initial data fetching, WebSocket for real-time updates.

**Rationale:**
- REST provides reliable request-response with error handling
- WebSocket enables instant broadcasting to all clients
- Separates concerns: CRUD operations vs. real-time synchronization

**Data Flow:**
```
User sends message
    ↓
POST /api/messages (REST)
    ↓
Backend saves to MySQL
    ↓
Socket.IO broadcasts 'message:new' event
    ↓
All connected clients receive event
    ↓
Redux updates local state
    ↓
UI re-renders automatically
```

### 2. Redux Toolkit for State Management

**Decision:** Use Redux Toolkit instead of Context API.

**Rationale:**
- Centralized state for user, messages, loading states
- Predictable state updates from WebSocket events
- Redux DevTools for debugging
- Easy to test with mock stores
- Scales well for additional features

**Tradeoff:** Adds bundle size (~15KB), but benefits outweigh cost for real-time apps.

### 3. Optimistic UI Updates

**Decision:** Show messages immediately in sender's UI before server confirmation.

**Rationale:**
- Improves perceived performance
- Better user experience with instant feedback
- Handles failure gracefully (restore input on error)

### 4. Push Notification Strategy

**Decision:** Use Expo Push Notifications with token registration on backend.

**Implementation:**
- Client requests notification permissions on login
- Registers Expo Push Token with backend
- Backend stores tokens in database
- On new message, backend sends push to all users except sender
- Invalid tokens automatically removed from database

**Tradeoff:** Requires Expo infrastructure, but provides reliable cross-platform push notifications.

### 5. Error Handling Strategy

**Levels:**
1. **Frontend Validation:** Max length (1000 chars), trim whitespace, non-empty check
2. **Backend Validation:** Parameterized queries prevent SQL injection
3. **Network Errors:** User-friendly Alert messages with retry option
4. **Socket Reconnection:** Automatic with exponential backoff

## Performance Optimizations

### Current 
- ✅ FlatList for efficient message rendering
- ✅ MySQL connection pooling (10 connections)
- ✅ Database indexes on frequently queried columns
- ✅ WebSocket for efficient real-time updates (vs. polling)
- ✅ Redux memoization with selectors

### Future Improvements 
- Message pagination with cursor-based approach
- React.memo for expensive components
- useMemo/useCallback for computed values
- Image compression for future media messages
- CDN for static assets
- Redis caching layer for frequently accessed data

## Known Limitations

1. **No Pagination:** Currently loads last 50 messages
   - **Impact:** Performance degrades with thousands of messages
   - **Solution:** Implement cursor-based pagination

2. **Simple Authentication:** Username only, no password
   - **Impact:** Anyone can impersonate anyone
   - **Solution:** Add JWT authentication

3. **Single Room:** All users see all messages
   - **Impact:** No privacy or organization
   - **Solution:** Implement rooms/channels system

4. **No Typing Indicators:** Can't see when others are typing
   - **Impact:** Less engaging UX
   - **Solution:** Add WebSocket event for typing status

## 4-Day Timeline

### Day 1 (5.5 hours): Foundation
- ✅ Project setup and structure (0.5h)
- ✅ Database schema design and MySQL setup (1h)
- ✅ Backend REST API endpoints (2h)
- ✅ WebSocket integration with Socket.IO (1h)
- ✅ Backend tests (1h)

### Day 2 (5 hours): Core Frontend
- ✅ Expo project initialization (0.5h)
- ✅ Redux store configuration (1h)
- ✅ API service layer and Socket.IO client (1h)
- ✅ Login screen with local persistence (1h)
- ✅ Main screen with message list (1.5h)

### Day 3 (7.5 hours): Features & Polish
- ✅ Real-time message updates integration (1.5h)
- ✅ Loading indicators and error handling (1h)
- ✅ Pull-to-refresh functionality (0.5h)
- ✅ Frontend tests (1h)
- ✅ Push notifications setup (1.5h)
- ✅ Bonus screens (Settings, Users List, Message Details) (2.0h)

### Day 4 (6 hours): Deployment & Documentation
- ✅ Backend deployment to AWS EC2 (1.5h)
- ✅ Expo app publishing (0.5h)
- ✅ README documentation (2h)
- ✅ Video walkthrough recording (1.5h)
- ✅ Final testing and bug fixes (0.5h)

**Total Time:** 24 hours
---

## Notes & Tradeoffs

### Key Decisions
1. **TypeScript Throughout:** Ensures type safety and reduces runtime errors
2. **Redux for State:** Better for complex state with WebSocket updates
3. **MySQL over NoSQL:** Structured data with relationships (users → messages)
4. **Expo over React Native CLI:** Faster development, easier deployment
5. **Socket.IO over WebSockets:** Higher-level API with automatic reconnection

### Production Considerations
- Add authentication (JWT tokens)
- Implement rate limiting
- Add message encryption
- Use environment-specific configs
- Add comprehensive error tracking (Sentry)
- Implement proper logging
- Add CI/CD pipeline


## Deployment Guide

## Deployment

### Backend (AWS EC2)
Currently deployed at: http://13.60.226.207:3000

### Frontend (Expo)
Published to Expo: https://expo.dev/preview/update?message=Updated+.env+for+host+backend&updateRuntimeVersion=1.0.0&createdAt=2025-11-01T18%3A44%3A49.741Z&slug=exp&projectId=4e36dfea-2cbf-46ba-86fb-69db3318fa1e&group=271d6f0b-b76d-4489-85b5-12b8db3219cb

## Troubleshooting

### Backend won't start
- Check MySQL is running: `mysql.server status`
- Verify .env credentials match MySQL
- Check port 3000 is not in use: `lsof -i :3000`

### Frontend can't connect
- Verify API_URL uses your machine's IP (not localhost)
- Check backend is running and accessible
- Ensure devices are on same network

### Tests failing
- Run `npm install` in both directories
- Check Node version (18+)
- Clear jest cache: `npx jest --clearCache`

## Reviewer Checklist ✅

Use this to verify the submission meets all acceptance criteria:

### Core Requirements
- [ ] Backend runs with `npm run dev` following README instructions
- [ ] Frontend runs with `npx expo start -c` following README instructions
- [ ] MySQL database schema loads successfully
- [ ] User can enter a username and login
- [ ] User can send a message
- [ ] Message persists in MySQL database
- [ ] Message appears in UI immediately (optimistic update)

### Real-Time Functionality
- [ ] Two connected clients show instant synchronization
- [ ] WebSocket connection established (check console logs)
- [ ] No manual refresh required for new messages
- [ ] Socket reconnection works after network interruption

### UX Requirements
- [ ] Loading spinner during initial data fetch
- [ ] Loading indicator when sending message
- [ ] Pull-to-refresh functionality works
- [ ] Error messages displayed for network failures
- [ ] Offline state handled gracefully

### Code Quality
- [ ] TypeScript used throughout (no `any` types)
- [ ] Redux manages state correctly
- [ ] Backend tests pass (`npm test` in server/)
- [ ] Frontend tests pass (`npm test` in app/)
- [ ] Code is well-organized and modular
- [ ] Environment variables configured properly

### Deliverables
- [ ] Git repository is public and accessible
- [ ] README has complete setup instructions
- [ ] Video walkthrough explains architecture and tradeoffs
- [ ] Live demo is functional and accessible
- [ ] All dependencies installable with `npm install`

### Bonus Features
- [ ] Push notifications work on physical device
- [ ] Additional screens (Settings, Users List, Message Details)
- [ ] Test coverage > 50% for a module
- [ ] Clean UI with modern design patterns

---

For questions or issues, please contact: rashmijayawardhana2001@gmail.com

