const { Client } = require('pg');

const password = encodeURIComponent('Eusouprojetochurch*2026');
const connectionString = `postgresql://postgres:${password}@db.yuhrisaktbfnuzjklqqu.supabase.co:5432/postgres`;

const client = new Client({
  connectionString: connectionString,
});

const sql = `
TRUNCATE TABLE churches CASCADE;

CREATE TABLE IF NOT EXISTS ministries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  director_pastor_name text,
  created_at timestamp with time zone DEFAULT now()
);
`;

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres.");
    
    await client.query(sql);
    console.log("SQL executed successfully: Ministries table created and churches truncated.");
    
  } catch (err) {
    console.error("Error executing SQL:", err.message);
  } finally {
    await client.end();
  }
}

run();
