// Author: Kondwani Phiri
var bcrypt = require('bcrypt');
var connectToDatabase = require('../db');
async function migratePasswords() {
  var connection;
  var count = 0;
  try {
    connection = await connectToDatabase();
    var result = await connection.execute('SELECT id, password FROM users');
    for (var i = 0; i < result[0].length; i++) {
      var user = result[0][i];
      if (/^\$2[aby]\$/.test(user.password)) continue;
      if (Buffer.byteLength(user.password, 'utf8') > 72) throw new Error('Reset legacy passwords longer than 72 bytes before migrating.');
      var hash = await bcrypt.hash(user.password, 12);
      await connection.execute('UPDATE users SET password = ? WHERE id = ? AND password = ?', [hash, user.id, user.password]);
      count++;
    }
    console.log('Passwords migrated: ' + count);
  } finally {
    if (connection) await connection.end();
  }
}
migratePasswords().catch(function(error) {
  console.error('Password migration failed:', error.code || error.message);
  process.exitCode = 1;
});
