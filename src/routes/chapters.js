const express = require('express');
const { check, validationResult } = require('express-validator');
const { sources } = require('../config/sources');

const router = express.Router();

// Validasi untuk konten chapter
const validateChapterContent = [
  check('chapterSlug').isString().matches(/^[a-z0-9-]+$/).trim(),
  check('source').optional().isIn(Object.keys(sources))
];

// Endpoint untuk konten chapter
router.get('/:chapterSlug', validateChapterContent, async (req, res) => {
  // Validasi input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid chapter slug or source' });
  }

  try {
    const source = req.query.source || 'komikcast';
    const scraper = require(`../scrapers/${source}`);
    const chapter = await scraper.fetchChapterContent(req.params.chapterSlug);
    res.json({ data: { chapter, source } });
  } catch (error) {
    if (error.message === 'Chapter not found') {
      res.status(404).json({ error: 'Chapter not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch chapter content' });
    }
  }
});

module.exports = router;