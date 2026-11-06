require('dotenv').config();
const express = require('express');
const cors = require('cors'); // ✅ Import CORS
const app = express();
const { sequelize } = require('./models');
const cookieParser = require("cookie-parser");


// Enable CORS for all routes
  app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Import routes
const moviesRoutes = require('./routes/movies');
const actorRoutes = require('./routes/actors');
const authRoutes = require('./routes/auth');
const collectionRoutes = require('./routes/collection');

// Routes
app.use('/api/movies', moviesRoutes);
app.use('/api/actors', actorRoutes);
app.use('/api/auth',authRoutes);
app.use('/api/collection',collectionRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('Movie API is running');
});

// Connect to DB and start server
const PORT = process.env.PORT || 4000;

sequelize.authenticate()
  .then(() => {
    console.log("Database connection established.");

    return sequelize.sync();
  })
  .then(() => {
    console.log("Database synced successfully.");

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });