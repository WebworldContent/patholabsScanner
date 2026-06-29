const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'pathology.db');

let db = null;
let SQL = null;

async function getDatabase() {
  if (db) return db;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  initializeSchema();
  seedData();
  saveDatabase();

  return db;
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initializeSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS pathologies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      phone TEXT,
      email TEXT,
      website TEXT,
      rating REAL DEFAULT 0,
      total_reviews INTEGER DEFAULT 0,
      opening_hours TEXT,
      about TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pathology_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      turnaround_time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pathology_id) REFERENCES pathologies(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pathology_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pathology_id) REFERENCES pathologies(id) ON DELETE CASCADE
    )
  `);
}

function seedData() {
  const count = db.exec('SELECT COUNT(*) as count FROM pathologies');
  if (count.length > 0 && count[0].values[0][0] > 0) return;

  const labs = [
    {
      name: 'PathCare Diagnostics',
      address: '42 MG Road, Indiranagar, Bangalore 560038',
      lat: 12.9716, lng: 77.6413,
      phone: '+91-80-41234567', email: 'info@pathcare.in',
      website: 'https://pathcare.in', rating: 4.5, total_reviews: 128,
      hours: 'Mon-Sat: 6:30 AM - 8:00 PM, Sun: 7:00 AM - 2:00 PM',
      about: 'PathCare is one of India\'s largest pathology networks with NABL accredited labs offering 3000+ tests with home collection.',
      image: 'https://placehold.co/400x200/3b82f6/ffffff?text=PathCare',
      tests: [
        ['Complete Blood Count (CBC)', 350, 'Measures overall health and detects disorders like anemia, infection, and leukemia.', '4-6 Hours'],
        ['Lipid Profile', 500, 'Measures cholesterol levels including HDL, LDL, and triglycerides.', '6-8 Hours'],
        ['Blood Sugar Fasting', 120, 'Measures blood glucose levels after fasting.', '2-4 Hours'],
        ['Thyroid Profile (T3, T4, TSH)', 650, 'Evaluates thyroid gland function.', '8-12 Hours'],
        ['Liver Function Test', 450, 'Measures liver enzymes and proteins to assess liver health.', '6-8 Hours']
      ],
      reviews: [
        ['Rahul S.', 5, 'Excellent service! Technician came on time for home collection. Reports were detailed and easy to understand.'],
        ['Priya M.', 4, 'Very professional staff at the center. Minimal wait time.'],
        ['Ankit K.', 5, 'Best pathology lab in the area. Accurate reports and reasonable prices.']
      ]
    },
    {
      name: 'Apollo Diagnostics',
      address: '78 100 Feet Road, HAL 2nd Stage, Bangalore 560008',
      lat: 12.9634, lng: 77.6480,
      phone: '+91-80-41123456', email: 'contact@apollodiag.com',
      website: 'https://apollodiagnostics.com', rating: 4.3, total_reviews: 95,
      hours: 'Mon-Sat: 6:00 AM - 9:00 PM, Sun: 6:00 AM - 12:00 PM',
      about: 'Apollo Diagnostics is part of the Apollo Hospitals Group, providing world-class diagnostic services with cutting-edge technology.',
      image: 'https://placehold.co/400x200/ef4444/ffffff?text=Apollo',
      tests: [
        ['Complete Blood Count (CBC)', 400, 'Comprehensive blood analysis for overall health assessment.', '4-6 Hours'],
        ['Lipid Profile', 550, 'Complete cholesterol panel with advanced lipid markers.', '8-10 Hours'],
        ['Blood Sugar Fasting', 100, 'Fasting blood glucose measurement.', '2-3 Hours'],
        ['HbA1c', 350, 'Average blood sugar level over past 2-3 months.', '6-8 Hours'],
        ['Vitamin D Test', 1200, 'Measures vitamin D levels in blood.', '12-24 Hours']
      ],
      reviews: [
        ['Sneha R.', 5, 'Great experience. Online reports available very quickly.'],
        ['Vikram P.', 4, 'Clean facilities and friendly staff. Slightly expensive but worth it.']
      ]
    },
    {
      name: 'Thyrocare Technologies',
      address: 'Plot 7, EPIP Area, Whitefield, Bangalore 560066',
      lat: 12.9698, lng: 77.7499,
      phone: '+91-80-43434343', email: 'support@thyrocare.com',
      website: 'https://thyrocare.com', rating: 4.1, total_reviews: 210,
      hours: 'Mon-Sun: 6:00 AM - 8:00 PM',
      about: 'Thyrocare is India\'s first fully automated diagnostic laboratory with pan-India presence offering affordable preventive healthcare.',
      image: 'https://placehold.co/400x200/8b5cf6/ffffff?text=Thyrocare',
      tests: [
        ['Thyroid Profile (T3, T4, TSH)', 350, 'Comprehensive thyroid function assessment.', '6-8 Hours'],
        ['Complete Blood Count (CBC)', 200, 'Basic blood workup for health screening.', '4-6 Hours'],
        ['Lipid Profile', 350, 'Standard cholesterol and lipid panel.', '6-8 Hours'],
        ['Whole Body Checkup', 2499, 'Comprehensive health package with 90+ parameters.', '24-36 Hours'],
        ['Diabetes Check', 400, 'Includes FBS, PPBS, and HbA1c.', '8-12 Hours']
      ],
      reviews: [
        ['Deepak V.', 4, 'Very affordable prices. The whole body checkup is a great deal.'],
        ['Neha G.', 3, 'Reports took longer than promised. Service was average.'],
        ['Ravi T.', 5, 'Best value for money. Regular health packages are very comprehensive.']
      ]
    },
    {
      name: 'Metropolis Healthcare',
      address: '55 Richmond Road, Shanthala Nagar, Bangalore 560025',
      lat: 12.9720, lng: 77.6067,
      phone: '+91-80-49191919', email: 'care@metropolis.in',
      website: 'https://metropolisindia.com', rating: 4.4, total_reviews: 156,
      hours: 'Mon-Sat: 6:30 AM - 7:30 PM, Sun: 7:00 AM - 1:00 PM',
      about: 'Metropolis is a multinational chain of diagnostic centers known for quality and accuracy with advanced molecular diagnostics.',
      image: 'https://placehold.co/400x200/f59e0b/ffffff?text=Metropolis',
      tests: [
        ['Complete Blood Count (CBC)', 380, 'Full hemogram analysis.', '4-6 Hours'],
        ['Lipid Profile', 480, 'Advanced lipid panel with ratios.', '6-8 Hours'],
        ['Liver Function Test', 520, 'Comprehensive hepatic function panel.', '6-8 Hours'],
        ['Kidney Function Test', 480, 'Renal function assessment.', '6-8 Hours'],
        ['Allergy Panel', 3500, 'Tests for 40+ common allergens.', '24-48 Hours']
      ],
      reviews: [
        ['Arun M.', 5, 'Very accurate reports. Doctors trust Metropolis for a reason.'],
        ['Kavita S.', 4, 'Good home collection service. Professional phlebotomists.']
      ]
    },
    {
      name: 'SRL Diagnostics',
      address: '92 Cunningham Road, Vasanth Nagar, Bangalore 560052',
      lat: 12.9890, lng: 77.5953,
      phone: '+91-80-49494949', email: 'info@srl.in',
      website: 'https://srl.in', rating: 4.2, total_reviews: 87,
      hours: 'Mon-Sat: 6:00 AM - 8:00 PM, Sun: 6:00 AM - 12:00 PM',
      about: 'SRL Diagnostics is a premier diagnostic chain with a focus on quality assurance and innovative testing methodologies.',
      image: 'https://placehold.co/400x200/10b981/ffffff?text=SRL',
      tests: [
        ['Complete Blood Count (CBC)', 320, 'Standard blood count analysis.', '4-6 Hours'],
        ['Lipid Profile', 420, 'Cholesterol and triglycerides panel.', '6-8 Hours'],
        ['Blood Sugar Fasting', 90, 'Fasting glucose test.', '2-4 Hours'],
        ['Vitamin B12', 800, 'Measures vitamin B12 levels.', '8-12 Hours'],
        ['Iron Studies', 600, 'Comprehensive iron deficiency panel.', '8-12 Hours']
      ],
      reviews: [
        ['Rajesh K.', 5, 'Very good diagnostic center with experienced staff.'],
        ['Meera D.', 4, 'Clean environment and efficient service.']
      ]
    }
  ];

  for (const lab of labs) {
    db.run(
      'INSERT INTO pathologies (name, address, latitude, longitude, phone, email, website, rating, total_reviews, opening_hours, about, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [lab.name, lab.address, lab.lat, lab.lng, lab.phone, lab.email, lab.website, lab.rating, lab.total_reviews, lab.hours, lab.about, lab.image]
    );
    const pathId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];

    for (const test of lab.tests) {
      db.run(
        'INSERT INTO tests (pathology_id, name, price, description, turnaround_time) VALUES (?, ?, ?, ?, ?)',
        [pathId, test[0], test[1], test[2], test[3]]
      );
    }

    for (const review of lab.reviews) {
      db.run(
        'INSERT INTO reviews (pathology_id, user_name, rating, comment) VALUES (?, ?, ?, ?)',
        [pathId, review[0], review[1], review[2]]
      );
    }
  }

  console.log('Database seeded with sample pathology data.');
}

function queryAll(stmt, params = []) {
  const sql = interpolate(stmt, params);
  const rows = db.exec(sql);
  if (rows.length === 0) return [];
  const cols = rows[0].columns;
  return rows[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function queryOne(stmt, params = []) {
  const rows = queryAll(stmt, params);
  return rows.length > 0 ? rows[0] : null;
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function interpolate(stmt, params) {
  let idx = 0;
  return stmt.replace(/\?/g, () => escapeSql(params[idx++]));
}

function runStmt(stmt, params = []) {
  const isInsert = stmt.trim().toUpperCase().startsWith('INSERT');
  const sql = isInsert
    ? interpolate(stmt, params) + '; SELECT last_insert_rowid() as id, changes() as changes'
    : interpolate(stmt, params);
  const results = db.exec(sql);
  saveDatabase();
  if (isInsert && results.length > 0) {
    const lastResult = results[results.length - 1];
    if (lastResult && lastResult.values && lastResult.values.length > 0) {
      return { lastInsertRowid: lastResult.values[0][0], changes: lastResult.values[0][1] };
    }
  }
  const affectedRows = results.length > 0 ? (results[0].affectedRows || 0) : 0;
  return { lastInsertRowid: null, changes: affectedRows };
}

function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

module.exports = { getDatabase, queryAll, queryOne, runStmt, closeDatabase, saveDatabase };
