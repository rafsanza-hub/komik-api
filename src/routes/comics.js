const express = require('express');
const { check, validationResult } = require('express-validator');
const { validStatuses, validTypes, validOrderBys } = require('../config/constants');
const { sources } = require('../config/sources');

const router = express.Router();

// Validasi untuk daftar komik
const validateComicsList = [
  check('page').optional().isInt({ min: 1, max: 326 }).toInt(),
  check('genres').optional().isString(),
  check('status').optional().isIn(validStatuses),
  check('type').optional().isIn(validTypes),
  check('orderby').optional().isIn(validOrderBys),
  check('source').optional().isIn(Object.keys(sources))
];

// Validasi untuk detail komik
const validateComicDetail = [
  check('slug').isString().matches(/^[a-z0-9-]+$/).trim(),
  check('source').optional().isIn(Object.keys(sources))
];

// Endpoint untuk daftar komik
router.get('/', validateComicsList, async (req, res) => {
  // Validasi input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid input parameters' });
  }

  try {
    const source = req.query.source || 'komikcast';
    const scraper = require(`../scrapers/${source}`);
    const page = req.query.page || 1;
    const genres = req.query.genres ? req.query.genres.split(',').map(g => g.trim().toLowerCase()) : [];
    const status = req.query.status || '';
    const type = req.query.type || '';
    const orderby = req.query.orderby || 'update';

    const params = { page, genres, status, type, orderby };
    const comicsList = await scraper.fetchComicsList(sources[source].baseUrl + sources[source].comicsListUrl, params);
    res.json({ data: { comicsList, page, genres, status, type, orderby, source } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comics list ' + error.message });
  }
});

// Endpoint untuk detail komik
router.get('/:slug', validateComicDetail, async (req, res) => {
  // Validasi input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid comic slug or source' });
  }

  try {
    const source = req.query.source || 'komikcast';
    const scraper = require(`../scrapers/${source}`);
    const comicDetail = await scraper.fetchComicDetail(req.params.slug);
    res.json({ data: { comicDetail, source } });
  } catch (error) {
    if (error.message === 'Comic not found') {
      res.status(404).json({ error: 'Comic not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch comic detail' });
    }
  }
});

module.exports = router;