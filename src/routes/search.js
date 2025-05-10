const express = require('express');
const { check, validationResult } = require('express-validator');
const { sources } = require('../config/sources');

const router = express.Router();

// Endpoint untuk pencarian komik
router.get('/', [
  check('source').optional().isIn(Object.keys(sources)),
  check('query').notEmpty().withMessage('Query is required')
], async (req, res) => {
  // Validasi input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const source = req.query.source || 'komikcast';
    const query = req.query.query;
    const scraper = require(`../scrapers/${source}`);
    const searchResults = await scraper.fetchSearchResults(query);
    res.json({ data: { comicsList: searchResults, source } });
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch search results for query "${req.query.query}"` });
  }
});

module.exports = router;