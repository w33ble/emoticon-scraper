var path = require('path');
var dbPath = path.join(__dirname, 'data', 'emoticons.json');
var db = require('lowdb');

db.path = dbPath;
db.load(dbPath);

return db;