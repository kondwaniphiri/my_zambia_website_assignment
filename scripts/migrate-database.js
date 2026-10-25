// Author: Kondwani Phiri
﻿require('../config/env');
var fs = require('fs');
var path = require('path');
var mysql = require('mysql2/promise');
var bcrypt = require('bcrypt');

async function migrate() {
  if (!/^[A-Za-z0-9_]+$/.test(process.env.DB_NAME || 'myzambia')) throw new Error('Invalid database name.');
  var name = process.env.DB_NAME || 'myzambia';
  var connection = await mysql.createConnection({host:process.env.DB_HOST || 'localhost',port:Number(process.env.DB_PORT || 3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true});
  try {
    await connection.query('CREATE DATABASE IF NOT EXISTS `' + name + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
    await connection.changeUser({database:name});
    var tables = (await connection.query('SHOW TABLES'))[0].map(function(row) {return Object.values(row)[0];});
    if (!tables.length) {
      await connection.query(fs.readFileSync(path.join(__dirname, '../myzambia.sql'), 'utf8'));
      console.log('Imported the assignment seed into the empty database.');
      tables = (await connection.query('SHOW TABLES'))[0].map(function(row) {return Object.values(row)[0];});
    }
    // Snapshot before structural changes. This private backup may contain legacy passwords.
    var snapshot = {};
    for (var i=0;i<tables.length;i++) {
      var table = tables[i].replace(/`/g,'``');
      snapshot[tables[i]] = {schema:(await connection.query('SHOW CREATE TABLE `' + table + '`'))[0][0]['Create Table'],rows:(await connection.query('SELECT * FROM `' + table + '`'))[0]};
    }
    fs.mkdirSync(path.join(__dirname, '../.local/backups'), {recursive:true});
    var backup = path.join(__dirname, '../.local/backups/database-' + Date.now() + '.json');
    fs.writeFileSync(backup, JSON.stringify(snapshot,null,2));
    console.log('Saved a private schema and data snapshot under .local/backups.');

    var checks = [
      ['SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1', 'Duplicate user emails'],
      ['SELECT userId, locationId FROM review GROUP BY userId, locationId HAVING COUNT(*) > 1', 'Duplicate reviews'],
      ['SELECT id FROM attractions GROUP BY id HAVING COUNT(*) > 1', 'Duplicate attraction IDs'],
      ['SELECT id FROM attractions WHERE id IS NULL OR id <= 0', 'Invalid attraction IDs'],
      ['SELECT userId FROM review WHERE rating < 1 OR rating > 5', 'Invalid review ratings'],
      ['SELECT r.userId FROM review r LEFT JOIN users u ON u.id = r.userId LEFT JOIN chillspots c ON c.id = r.locationId WHERE u.id IS NULL OR c.id IS NULL', 'Orphaned reviews']
    ];
    for (var i=0;i<checks.length;i++) {
      if ((await connection.query(checks[i][0]))[0].length) throw new Error(checks[i][1] + ': resolve these records before migrating. No rows were deleted.');
    }
    async function hasIndex(table, column, unique) {
      var rows=(await connection.query('SHOW INDEX FROM `' + table + '`'))[0];
      return rows.some(function(row) {return row.Column_name==column && (!unique || row.Non_unique==0);});
    }
    async function hasConstraint(name) {
      return (await connection.execute('SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = ? AND CONSTRAINT_NAME = ?', [process.env.DB_NAME || 'myzambia',name]))[0].length > 0;
    }
    if (!await hasIndex('users','email',true)) await connection.query('ALTER TABLE users ADD UNIQUE KEY uq_users_email (email)');
    var attractionColumns = (await connection.query('SHOW COLUMNS FROM attractions'))[0];
    var chillColumns = (await connection.query('SHOW COLUMNS FROM chillspots'))[0];
    var reviewColumns = (await connection.query('SHOW COLUMNS FROM review'))[0];
    if (!await hasIndex('attractions','id',true)) await connection.query('ALTER TABLE attractions MODIFY id BIGINT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (id)');
    else if (!attractionColumns.some(function(column) {return column.Field == 'id' && column.Extra.indexOf('auto_increment') != -1;})) await connection.query('ALTER TABLE attractions MODIFY id BIGINT NOT NULL AUTO_INCREMENT');
    if (!chillColumns.some(function(column) {return column.Field == 'id' && column.Extra.indexOf('auto_increment') != -1;})) await connection.query('ALTER TABLE chillspots MODIFY id BIGINT NOT NULL AUTO_INCREMENT');
    if (!reviewColumns.some(function(column) {return column.Field == 'locationId' && column.Type == 'bigint';})) await connection.query('ALTER TABLE review MODIFY locationId BIGINT NOT NULL');
    if (!await hasConstraint('uq_review_user_location')) await connection.query('ALTER TABLE review ADD CONSTRAINT uq_review_user_location UNIQUE (userId, locationId)');
    if (!await hasConstraint('fk_review_user')) await connection.query('ALTER TABLE review ADD CONSTRAINT fk_review_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE');
    if (!await hasConstraint('fk_review_location')) await connection.query('ALTER TABLE review ADD CONSTRAINT fk_review_location FOREIGN KEY (locationId) REFERENCES chillspots(id) ON DELETE CASCADE');
    if (!await hasConstraint('chk_review_rating')) await connection.query('ALTER TABLE review ADD CONSTRAINT chk_review_rating CHECK (rating >= 1 AND rating <= 5)');
    async function addDirectoryColumn(table, field, definition) {
      var columns = (await connection.query('SHOW COLUMNS FROM ' + table))[0];
      if (!columns.some(function(column) { return column.Field == field; })) {
        await connection.query('ALTER TABLE ' + table + ' ADD COLUMN ' + field + ' ' + definition);
      }
    }
    await addDirectoryColumn('chillspots', 'opening_hours', 'VARCHAR(255) NULL');
    await addDirectoryColumn('chillspots', 'activities', 'JSON NULL');
    await addDirectoryColumn('attractions', 'province', 'VARCHAR(255) NULL');
    await addDirectoryColumn('attractions', 'opening_hours', 'VARCHAR(255) NULL');
    await addDirectoryColumn('attractions', 'phone', 'VARCHAR(64) NULL');
    await addDirectoryColumn('attractions', 'site', 'VARCHAR(1024) NULL');
    // Seed filter labels from existing descriptions; do not invent opening hours or contacts.
    var directory = require('../public/javascripts/places');
    var attractionPlaces = (await connection.query('SELECT id, location FROM attractions WHERE province IS NULL'))[0];
    for (var i=0; i<attractionPlaces.length; i++) {
      var provinces = directory.provincesFromLocation(attractionPlaces[i].location);
      if (provinces.length) await connection.execute('UPDATE attractions SET province = ? WHERE id = ?', [provinces.join(', '), attractionPlaces[i].id]);
    }
    var chillPlaces = (await connection.query('SELECT id, h2 FROM chillspots WHERE activities IS NULL'))[0];
    for (var i=0; i<chillPlaces.length; i++) {
      await connection.execute('UPDATE chillspots SET activities = ? WHERE id = ?', [JSON.stringify(directory.activitiesFromCategory(chillPlaces[i].h2)), chillPlaces[i].id]);
    }
    await connection.query('CREATE TABLE IF NOT EXISTS app_sessions (sid VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY, data MEDIUMTEXT NOT NULL, expires BIGINT NOT NULL, INDEX ix_sessions_expires (expires)) ENGINE=InnoDB');
    await connection.query('CREATE TABLE IF NOT EXISTS login_limits (bucket_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY, attempts INT UNSIGNED NOT NULL, expires BIGINT NOT NULL, INDEX ix_limits_expires (expires)) ENGINE=InnoDB');
    await connection.query("CREATE TABLE IF NOT EXISTS newsletter_subscribers (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE, status ENUM('pending','active','unsubscribed') NOT NULL DEFAULT 'pending', confirm_hash CHAR(64) NULL, confirm_expires BIGINT NULL, unsubscribe_token CHAR(64) NOT NULL, requested_at BIGINT NOT NULL, confirmed_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX ix_subscriber_status (status)) ENGINE=InnoDB");
    await connection.query("CREATE TABLE IF NOT EXISTS contact_messages (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(254) NOT NULL, subject VARCHAR(150) NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
    await connection.query("CREATE TABLE IF NOT EXISTS newsletter_campaigns (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, subject VARCHAR(150) NOT NULL, body TEXT NOT NULL, status ENUM('draft','queued') NOT NULL DEFAULT 'draft', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
    await connection.query("CREATE TABLE IF NOT EXISTS email_outbox (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, kind VARCHAR(20) NOT NULL, recipient VARCHAR(254) NOT NULL, payload JSON NOT NULL, subscriber_id BIGINT NULL, campaign_id BIGINT NULL, status ENUM('queued','sending','sent','failed','skipped') NOT NULL DEFAULT 'queued', attempts INT NOT NULL DEFAULT 0, available_at BIGINT NOT NULL DEFAULT 0, locked_until BIGINT NULL, last_error VARCHAR(100) NULL, sent_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_campaign_recipient (campaign_id, subscriber_id), INDEX ix_outbox_ready (status, available_at), FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id), FOREIGN KEY (campaign_id) REFERENCES newsletter_campaigns(id)) ENGINE=InnoDB");
    if (!await hasIndex('newsletter_subscribers','unsubscribe_token',true)) await connection.query('ALTER TABLE newsletter_subscribers ADD UNIQUE KEY uq_unsubscribe_token (unsubscribe_token)');
    if (!await hasIndex('newsletter_subscribers','confirm_hash',false)) await connection.query('ALTER TABLE newsletter_subscribers ADD INDEX ix_confirm_hash (confirm_hash)');
    var users=(await connection.query('SELECT id, password FROM users'))[0];
    for(var i=0;i<users.length;i++) {
      if (/^\$2[aby]\$/.test(users[i].password)) continue;
      if(Buffer.byteLength(users[i].password,'utf8')>72) throw new Error('Reset passwords exceeding 72 bytes before migrating.');
      await connection.execute('UPDATE users SET password = ? WHERE id = ?', [await bcrypt.hash(users[i].password,12),users[i].id]);
    }
    // Normalize seed website domains; preserve other stored content.
    var locations=(await connection.query('SELECT id, site FROM chillspots'))[0];
    for(var i=0;i<locations.length;i++) {
      if(typeof locations[i].site=='string' && /^(www\.)?[A-Za-z0-9-]+\.[A-Za-z]{2,}(\/.*)?$/.test(locations[i].site)) {
        await connection.execute('UPDATE chillspots SET site = ? WHERE id = ?', ['https://'+locations[i].site,locations[i].id]);
      }
    }
    await connection.query('CREATE TABLE IF NOT EXISTS app_migrations (name VARCHAR(128) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    await connection.execute('INSERT IGNORE INTO app_migrations (name) VALUES (?)', ['001-security-and-integrity']);
    await connection.execute('INSERT IGNORE INTO app_migrations (name) VALUES (?)', ['002-place-directory']);
    await connection.execute('INSERT IGNORE INTO app_migrations (name) VALUES (?)', ['003-email-and-newsletters']);
    console.log('Migration complete: unique keys, generated IDs, review foreign keys/rating constraint, session/rate-limit tables, directory fields, email/newsletter tables and hashed passwords.');
  } finally {await connection.end();}
}
migrate().catch(function(error) {console.error('Migration failed:',error.code || error.message);process.exitCode=1;});
