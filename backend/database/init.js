const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database.sqlite';

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
    });

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    db.exec(schema, (err) => {
      if (err) {
        console.error('Error creating tables:', err);
        reject(err);
        return;
      }
      console.log('Database tables created successfully');
      resolve(db);
    });
  });
}

function getDatabase() {
  return new sqlite3.Database(DB_PATH);
}

module.exports = {
  initializeDatabase,
  getDatabase
};