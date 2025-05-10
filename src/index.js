require('dotenv').config();
const express = require('express');
const { logger } = require('./config/logger');
const cors = require('cors');

// Inisialisasi aplikasi Express
const app = express();
const port = process.env.PORT|| 3000;

// Middleware untuk parsing JSON
app.use(express.json());

// Logging untuk semua permintaan
app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.url}`, { ip: req.ip });
  next();
});

app.use(cors({
  origin: '*', 
}));

// Mount rute
app.use('/api/comics', require('./routes/comics'));
app.use('/api/chapters', require('./routes/chapters'));
app.use('/api/genres', require('./routes/genres'));
app.use('/api/popular-manga', require('./routes/popular-manga'));
app.use('/api/search', require('./routes/search'));

// Penanganan error
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Jalankan server
app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});