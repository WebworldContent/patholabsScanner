const express = require('express');
const path = require('path');
const cors = require('cors');
const { getDatabase, closeDatabase, queryOne } = require('./database');

const pathologiesRouter = require('./routes/pathologies');
const testsRouter = require('./routes/tests');
const reviewsRouter = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/pathologies', pathologiesRouter);
app.use('/api/tests', testsRouter);
app.use('/api/reviews', reviewsRouter);

app.get('/api/stats', (req, res) => {
  try {
    const totalLabs = queryOne('SELECT COUNT(*) as count FROM pathologies').count;
    const totalTests = queryOne('SELECT COUNT(*) as count FROM tests').count;
    const totalReviews = queryOne('SELECT COUNT(*) as count FROM reviews').count;
    const avgRating = queryOne('SELECT ROUND(AVG(rating), 1) as avg FROM pathologies').avg;
    res.json({ totalLabs, totalTests, totalReviews, avgRating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

async function start() {
  await getDatabase();
  app.listen(PORT, () => {
    console.log(`Pathology Comparison App running at http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
