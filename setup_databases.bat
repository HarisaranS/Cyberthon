@echo off
echo Setting up vulnerable MySQL databases...
echo.

docker compose exec -T mongodb mongosh < setup_vulnerable_dbs.sql 2>nul

echo Creating MySQL databases via Docker...
docker compose exec -T backend node -e "const mysql = require('mysql2/promise'); (async () => { const conn = await mysql.createConnection({ host: 'host.docker.internal', port: 3306, user: 'root', password: 'root' }); const sql = require('fs').readFileSync('setup_vulnerable_dbs.sql', 'utf8'); const statements = sql.split(';').filter(s => s.trim()); for (const stmt of statements) { if (stmt.trim()) { try { await conn.execute(stmt); } catch (e) { if (!e.message.includes('database exists')) console.log('Error:', e.message); } } } await conn.end(); console.log('✅ MySQL databases created!'); })();"

echo.
echo ✅ All vulnerable databases created!
echo.
echo Databases created:
echo   - MySQL: hr_system, customer_db, medical_records, financial_data, voter_registry
echo   - MongoDB: vulnerable_app_db
echo.
pause
