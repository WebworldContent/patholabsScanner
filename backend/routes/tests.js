const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runStmt } = require('../database');

router.get('/', (req, res) => {
  try {
    const { pathology_id } = req.query;
    let tests;
    if (pathology_id) {
      tests = queryAll('SELECT * FROM tests WHERE pathology_id = ?', [pathology_id]);
    } else {
      tests = queryAll('SELECT t.*, p.name as pathology_name FROM tests t JOIN pathologies p ON t.pathology_id = p.id');
    }
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { pathology_id, name, price, description, turnaround_time } = req.body;
    if (!pathology_id || !name || !price) {
      return res.status(400).json({ error: 'pathology_id, name, and price are required' });
    }

    const pathology = queryOne('SELECT id FROM pathologies WHERE id = ?', [pathology_id]);
    if (!pathology) return res.status(404).json({ error: 'Pathology lab not found' });

    const result = runStmt(
      'INSERT INTO tests (pathology_id, name, price, description, turnaround_time) VALUES (?, ?, ?, ?, ?)',
      [pathology_id, name, price, description || null, turnaround_time || null]
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Test added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM tests WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Test not found' });

    const { name, price, description, turnaround_time } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (turnaround_time !== undefined) { updates.push('turnaround_time = ?'); values.push(turnaround_time); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.params.id);
    runStmt(`UPDATE tests SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Test updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM tests WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Test not found' });
    runStmt('DELETE FROM tests WHERE id = ?', [req.params.id]);
    res.json({ message: 'Test deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
