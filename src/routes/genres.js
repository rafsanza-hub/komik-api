const express = require('express');
const { check, validationResult } = require('express-validator');
const { sources } = require('../config/sources');

const router = express.Router();

// Endpoint untuk daftar genre
router.get('/', [
  check('source').optional().isIn(Object.keys(sources))
], async (req, res) => {
  // Validasi input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid source' });
  }

  try {
    const source = req.query.source || 'komikcast';
    const scraper = require(`../scrapers/${source}`);
    const genresList = await scraper.fetchGenres(sources[source].baseUrl + sources[source].genresUrl);
    res.json({ data: { genres: genresList, source } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

// Endpoint untuk daftar komik berdasarkan genre
router.get('/:genre', [
  check('source').optional().isIn(Object.keys(sources)),
  check('page').optional().isInt({ min: 1 }).toInt()
], async (req, res) => {
  // Validasi input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const source = req.query.source || 'komikcast';
    const genre = req.params.genre;
    const page = req.query.page || 1;
    const scraper = require(`../scrapers/${source}`);
    const comicsByGenre = await scraper.fetchComicsByGenre(genre, page);
    res.json({ data: { comicsList: comicsByGenre.comics, pagination: comicsByGenre.pagination, source } });
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch comics for genre ${req.params.genre}` });
  }
});

module.exports = router;