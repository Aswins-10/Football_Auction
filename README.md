# Football Auction Platform (AuctionFC)

A comprehensive, real-time web application built for managing football tournaments, teams, and conducting live player auctions. This platform allows administrators to set up tournaments and auctions, while team owners can browse players, manage their squads, and participate in real-time bidding for players.

## Features

- **User Authentication & Role Management**: Secure registration and login system with role-based access control (Admin, Team Owner, User).
- **Tournament Management**: Admins can create and manage multiple football tournaments.
- **Team Management**: Team owners can request to join teams within a tournament, manage their roster, and track their budget.
- **Player Database**: Comprehensive player listing with advanced filtering and search capabilities (by name, position, status, etc.).
- **Real-Time Auction System**: Live, synchronized player auction bidding system powered by WebSockets, allowing team owners to bid on players in real-time.
- **Responsive UI**: A modern, dark-themed user interface built with Tailwind CSS, offering an optimal experience across different devices.

## Tech Stack

This project is built using the **MERN** stack with WebSocket integration:

### Frontend (Client)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Real-time Communication**: Socket.io-client

### Backend (Server)
- **Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Real-time Communication**: Socket.io
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **Media Storage**: Cloudinary (via Multer)

## Getting Started

Follow these instructions to set up the project locally for development and testing.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) account/database
- [Cloudinary](https://cloudinary.com/) account for image uploads

### Installation

1. **Clone the repository** (if applicable) or download the source code:
   ```bash
   git clone <repository-url>
   cd Auction
   ```

2. **Setup the Backend (Server)**
   Navigate to the `server` directory and install dependencies:
   ```bash
   cd server
   npm install
   ```

3. **Configure Server Environment Variables**
   Create a `.env` file in the `server` root directory and add the following keys. Replace the placeholder values with your actual credentials:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:5173

   # Cloudinary configuration for media uploads
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Setup the Frontend (Client)**
   Open a new terminal, navigate to the `client` directory, and install dependencies:
   ```bash
   cd client
   npm install
   ```
   *(If the frontend requires an API base URL defined in an environment variable, create a `.env` file in the `client` directory as well, e.g., `VITE_API_URL=http://localhost:5000`).*

### Running the Application

To run both the server and the client simultaneously for development:

1. **Start the Backend Server**
   In the `server` directory terminal:
   ```bash
   npm run dev
   ```
   *The server should start on exactly the port defined in your `.env` (default is 5000).*

2. **Start the Frontend Client**
   In the `client` directory terminal:
   ```bash
   npm run dev
   ```
   *The client will typically start on `http://localhost:5173`.*

3. Open your browser and navigate to `http://localhost:5173` to view the application.

## Deployment Guide (Render / Cloud Hosting)

### Quick Deploy with Render Blueprint (`render.yaml`)

1. Push your repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New** ➔ **Blueprint**.
3. Connect your GitHub repository. Render will automatically detect `render.yaml` and configure both the backend server and static frontend site.
4. Fill in the required environment variables:
   - `MONGO_URI`: Your production MongoDB connection string (e.g. MongoDB Atlas cluster).
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for media storage.
5. Deploy! Render will link `CLIENT_URL` and `VITE_API_URL` dynamically between both services.

---

### Manual Deployment Checklist

#### Backend (Render / Railway / Heroku)
- **Root Directory / Subdirectory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/healthz`
- **Required Environment Variables**:
  - `MONGO_URI`: Production MongoDB Atlas connection URI.
  - `JWT_SECRET`: Secret key for JWT signing.
  - `CLIENT_URL`: HTTPS URL of your deployed frontend (e.g. `https://football-auction-client.onrender.com` or `https://your-app.vercel.app`).
  - `CLOUDINARY_*`: Cloudinary API keys for image uploads.

#### Frontend (Render Static Site / Vercel / Netlify)
- **Root Directory / Subdirectory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Single Page Application (SPA) Rewrite Rule**: `/*` ➔ `/index.html` (HTTP 200 rewrite for React Router v7).
- **Required Environment Variables**:
  - `VITE_API_URL`: HTTPS URL of your deployed backend API (e.g. `https://football-auction-server.onrender.com`).

---

## Project Structure

```text
Auction/
├── render.yaml             # Render deployment blueprint
├── client/                 # React frontend application
│   ├── public/             # Static assets
│   ├── src/                # React components, pages, context, and styles
│   ├── package.json        # Frontend dependencies and scripts
│   └── vite.config.js      # Vite configuration
└── server/                 # Node.js/Express backend application
    ├── src/
    │   ├── config/         # Database and third-party service configs
    │   ├── controllers/    # Route handlers (logic)
    │   ├── models/         # Mongoose schema definitions
    │   ├── routes/         # Express API routes
    │   └── socket/         # Socket.io event handlers
    ├── server.js           # Server entry point
    └── package.json        # Backend dependencies and scripts
```

