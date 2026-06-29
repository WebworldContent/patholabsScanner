const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runStmt } = require('../database');

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get('/', (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    let pathologies = queryAll('SELECT * FROM pathologies ORDER BY rating DESC');

    if (lat && lng) {
      const maxRadius = radius ? parseFloat(radius) : 5;
      pathologies = pathologies.filter(p => {
        const dist = getDistance(parseFloat(lat), parseFloat(lng), p.latitude, p.longitude);
        p.distance = Math.round(dist * 10) / 10;
        return dist <= maxRadius;
      });
    }

    const pathologiesWithTests = pathologies.map(p => {
      const tests = queryAll('SELECT * FROM tests WHERE pathology_id = ?', [p.id]);
      return { ...p, tests };
    });

    res.json(pathologiesWithTests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/compare', (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',').map(Number) : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: 'Provide pathology IDs to compare via ?ids=1,2,3' });
    }

    const result = [];
    for (const id of ids) {
      const p = queryOne('SELECT * FROM pathologies WHERE id = ?', [id]);
      if (p) {
        const tests = queryAll('SELECT * FROM tests WHERE pathology_id = ?', [id]);
        const reviews = queryAll('SELECT * FROM reviews WHERE pathology_id = ? ORDER BY created_at DESC', [id]);
        result.push({ ...p, tests, reviews });
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const pathology = queryOne('SELECT * FROM pathologies WHERE id = ?', [req.params.id]);
    if (!pathology) return res.status(404).json({ error: 'Pathology not found' });

    const tests = queryAll('SELECT * FROM tests WHERE pathology_id = ?', [req.params.id]);
    const reviews = queryAll('SELECT * FROM reviews WHERE pathology_id = ? ORDER BY created_at DESC', [req.params.id]);

    res.json({ ...pathology, tests, reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, address, latitude, longitude, phone, email, website, opening_hours, about } = req.body;
    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json({ error: 'Name, address, latitude, and longitude are required' });
    }

    const result = runStmt(
      'INSERT INTO pathologies (name, address, latitude, longitude, phone, email, website, opening_hours, about) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, address, latitude, longitude, phone || null, email || null, website || null, opening_hours || null, about || null]
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Pathology lab created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM pathologies WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Pathology not found' });

    const fields = ['name', 'address', 'latitude', 'longitude', 'phone', 'email', 'website', 'opening_hours', 'about', 'rating', 'image_url'];
    const updates = [];
    const values = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    runStmt(`UPDATE pathologies SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, values);
    res.json({ message: 'Pathology lab updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM pathologies WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Pathology not found' });
    runStmt('DELETE FROM pathologies WHERE id = ?', [req.params.id]);
    res.json({ message: 'Pathology lab deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
