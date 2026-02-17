# Room Expenses App

A MERN stack application for managing room expenses.

## Project Structure

- **frontend**: React application (Vite)
- **backend**: Node.js/Express API

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local or Atlas URI)

### Local Development

1.  **Backend Setup**
    ```bash
    cd backend
    npm install
    npm run dev
    ```

2.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Deployment

### Environment Variables

**Backend (.env)**
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

**Frontend**
The frontend requires the backend URL to be set at build time.
Set the `VITE_API_URL` environment variable in your deployment platform (e.g., Vercel, Netlify).

```
VITE_API_URL=https://your-backend-url.com/api
```

### Build

**Frontend**
```bash
cd frontend
npm run build
```

**Backend**
```bash
cd backend
npm start
```

## Troubleshooting

- **404 Errors on Deep Links:** Ensure `vercel.json` contains rewrites for client-side routing.