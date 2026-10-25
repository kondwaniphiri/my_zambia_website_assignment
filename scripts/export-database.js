// Author: Kondwani Phiri
// Export a shareable database seed without private account or email data.
require('../config/env');
var fs = require('fs');
var path = require('path');
var mysql = require('mysql2');
var bcrypt = require('bcrypt');
var taskCrypto = require('crypto');
var connect = require('../db');

async function exportDatabase() {
    var connection = await connect();
    try {
        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
        var tables = (await connection.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"'))[0].map(function(row) { return Object.values(row)[0]; });
        var publicTables = ['attractions', 'chillspots', 'news', 'review', 'app_migrations'];
        var sql = [
            '-- Author: Kondwani Phiri',
            '-- MyZambia: current schema and public content.',
            '-- Accounts are anonymized with discarded random password hashes.',
            '-- Sessions, rate limits, messages, subscribers, campaigns and outbox are empty.',
            'SET NAMES utf8mb4;',
            'SET FOREIGN_KEY_CHECKS = 0;'
        ];
        for (var i = 0; i < tables.length; i++) {
            var table = tables[i];
            var quoted = mysql.escapeId(table);
            var schema = (await connection.query('SHOW CREATE TABLE ' + quoted))[0][0]['Create Table'];
            sql.push('\n' + schema + ';');
            var rows = [];
            if (publicTables.indexOf(table) != -1) rows = (await connection.query('SELECT * FROM ' + quoted))[0];
            if (table == 'users') {
                rows = (await connection.query('SELECT id FROM users ORDER BY id'))[0];
                for (var u = 0; u < rows.length; u++) {
                    rows[u].name = 'Sample visitor ' + rows[u].id;
                    rows[u].email = 'visitor' + rows[u].id + '@example.invalid';
                    rows[u].password = await bcrypt.hash(taskCrypto.randomBytes(32).toString('hex'), 12);
                }
            }
            rows.forEach(function(row) {
                var fields = Object.keys(row);
                var values = fields.map(function(field) {
                    var value = row[field];
                    if (value && typeof value == 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) value = JSON.stringify(value);
                    return mysql.escape(value);
                });
                sql.push('INSERT INTO ' + quoted + ' (' + fields.map(mysql.escapeId).join(', ') + ') VALUES (' + values.join(', ') + ');');
            });
        }
        sql.push('\nSET FOREIGN_KEY_CHECKS = 1;\n');
        await connection.commit();
        var output = path.join(__dirname, '../myzambia.sql');
        fs.mkdirSync(path.join(__dirname, '../.local/backups'), {recursive: true});
        if (fs.existsSync(output)) fs.copyFileSync(output, path.join(__dirname, '../.local/backups/seed-before-export-' + Date.now() + '.sql'));
        fs.writeFileSync(output, sql.join('\n'));
        console.log('Exported ' + tables.length + ' table definitions to myzambia.sql; private data excluded.');
    } finally {
        await connection.end();
    }
}
exportDatabase().catch(function(error) { console.error('Export failed:', error.code || error.message); process.exitCode = 1; });
