#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const SQL_DIR = path.resolve(__dirname, '..', 'sql');
const SQL_FILE = path.join(SQL_DIR, '001_init.sql');

function run(cmd) {
  console.log('> ' + cmd);
  return execSync(cmd, { stdio: 'inherit' });
}

function dockerAvailable() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  // Read env to decide
  const host = process.env.PGHOST;
  if (host) {
    console.log('Using existing Postgres at', host);
    console.log('Run psql to apply:', SQL_FILE);
    console.log(`psql "host=${process.env.PGHOST} port=${process.env.PGPORT || 5432} user=${process.env.PGUSER || 'robby'} dbname=${process.env.PGDATABASE || 'robby'}" -f ${SQL_FILE}`);
    return;
  }

  if (!dockerAvailable()) {
    console.error('Docker not available. Please set PGHOST/PG* env vars or install Docker.');
    process.exit(1);
  }

  const containerName = 'robby_pa_dev_postgres';
  try {
    // If the docker-compose started container is present, apply migration there.
    try {
      run(`docker inspect ${containerName}`);
      console.log('Container', containerName, 'already exists — applying migration in-place');
      // ensure a clean public schema so migrations are applied predictably
      run(`docker exec -i ${containerName} psql -U robby -d robby -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`);
      run(`docker exec -i ${containerName} psql -U robby -d robby -f /migrations/001_init.sql`);
      console.log('Migration applied to existing container', containerName, 'on port 5433');
      console.log('Connection: host=localhost port=5433 user=robby password=pass dbname=robby');
    } catch (e) {
      // start container with local sql mounted
      run(`docker rm -f ${containerName} || true`);
      run(`docker run -d --name ${containerName} -e POSTGRES_PASSWORD=pass -e POSTGRES_USER=robby -e POSTGRES_DB=robby -v ${SQL_DIR}:/migrations -p 5433:5432 postgres:15`);

      console.log('Waiting for Postgres to be ready (sleep 5s)...');
      execSync('sleep 5');

      // ensure a clean public schema so migrations are applied predictably
      run(`docker exec -i ${containerName} psql -U robby -d robby -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`);
      // apply migration
      run(`docker exec -i ${containerName} psql -U robby -d robby -f /migrations/001_init.sql`);

      console.log('Migration applied to container', containerName, 'on port 5433');
      console.log('Connection: host=localhost port=5433 user=robby password=pass dbname=robby');
    }
  } catch (err) {
    console.error('Migration failed:', err && err.message);
    process.exit(2);
  }
}

main();
