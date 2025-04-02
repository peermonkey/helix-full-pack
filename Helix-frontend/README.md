# MongoDB Data Display Application

A simple web application that displays data from MongoDB.

## Features

- Connect to MongoDB database
- Display items from the database
- Add new items through a form
- Responsive design

## Prerequisites

- Node.js (v12 or higher)
- MongoDB (local or remote)

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/itemsdb
   PORT=3000
   ```
   Note: Update the MONGODB_URI with your actual MongoDB connection string.

## Running the Application

For development (with hot reload):
```
npm run dev
```

For production:
```
npm start
```

Access the application at: http://localhost:3000

## Project Structure

- `server.js` - Main application entry point
- `models/` - MongoDB models
- `routes/` - API routes
- `public/` - Frontend files (HTML, CSS, JavaScript)

## How It Works

1. The application connects to MongoDB using Mongoose
2. Express.js serves the API endpoints and static files
3. The frontend JavaScript fetches data from the API and renders it
4. The form allows adding new items to the database

## Customizing

You can modify the Item model in `models/Item.js` to match your specific data needs. 