# TEG One-Page Dashboard

A React/Vite dashboard for exploring thermoelectric material data backed by MongoDB.

## Requirements

- Node.js 18 or newer
- A MongoDB Atlas cluster or local MongoDB instance
- MongoDB network access configured for the machine running the app

## Install dependencies

From the project root:

```powershell
npm install
```

## Configure MongoDB locally

Create or update `.env` in the project root:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/
MONGODB_DB_NAME=MDB
MONGODB_COLLECTION=Materials
BACKEND_PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

Replace `USERNAME`, `PASSWORD`, and `YOUR_CLUSTER` with the credentials and cluster details for your MongoDB database.

In MongoDB Atlas, make sure the user has database access and the current IP address is allowed under **Network Access**.

Do not commit `.env` files or share database passwords. Rotate credentials if they are exposed.

## Start the application

Start the backend in one terminal:

```powershell
node backend/server.js
```

The API runs at `http://localhost:4000`.

Start the frontend in a second terminal from the project root:

```powershell
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Deploy to Render

This repository includes `render.yaml` for a single Render Web Service. The service builds the Vite frontend and serves it from the Express backend, so the production frontend can call `/api` on the same domain.

1. Push the repository to GitHub or GitLab.
2. In Render, choose **New > Blueprint** and select the repository.
3. When prompted for `MONGODB_URI`, enter the MongoDB connection string as a secret environment variable.
4. Deploy the service. Render uses `npm ci && npm run build` to build and `node backend/server.js` to start it.

The Blueprint sets `MONGODB_DB_NAME=MDB` and `MONGODB_COLLECTION=Materials`. If your MongoDB Atlas cluster restricts network access, allow Render's outbound connections or use the appropriate Atlas network-access configuration.

## Useful commands

```powershell
npm run build
npm run lint
```

The frontend source lives under `frontend/src`. It uses `VITE_API_URL` from the root `.env` when configured. For local development, the default API URL is `http://localhost:4000/api`.
# ThermoDataBank
