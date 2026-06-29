const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runStmt } = require('../database');

router.get('/:pathologyId', (req, res) => {
  try {
    const reviews = queryAll(
      'SELECT * FROM reviews WHERE pathology_id = ? ORDER BY created_at DESC',
      [req.params.pathologyId]
    );
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { pathology_id, user_name, rating, comment } = req.body;
    if (!pathology_id || !user_name || !rating) {
      return res.status(400).json({ error: 'pathology_id, user_name, and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const pathology = queryOne('SELECT id FROM pathologies WHERE id = ?', [pathology_id]);
    if (!pathology) return res.status(404).json({ error: 'Pathology lab not found' });

    const result = runStmt(
      'INSERT INTO reviews (pathology_id, user_name, rating, comment) VALUES (?, ?, ?, ?)',
      [pathology_id, user_name, rating, comment || null]
    );

    const stats = queryOne(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE pathology_id = ?',
      [pathology_id]
    );

    runStmt(
      'UPDATE pathologies SET rating = ?, total_reviews = ?, updated_at = datetime("now") WHERE id = ?',
      [Math.round(stats.avg_rating * 10) / 10, stats.total, pathology_id]
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Review added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const review = queryOne('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    runStmt('DELETE FROM reviews WHERE id = ?', [req.params.id]);

    const stats = queryOne(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE pathology_id = ?',
      [review.pathology_id]
    );

    runStmt(
      'UPDATE pathologies SET rating = ?, total_reviews = ?, updated_at = datetime("now") WHERE id = ?',
      [stats.total > 0 ? Math.round(stats.avg_rating * 10) / 10 : 0, stats.total, review.pathology_id]
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
