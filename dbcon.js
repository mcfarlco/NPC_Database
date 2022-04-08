const mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs340_mcfarlco',
  password        : '4462',
  database        : 'cs340_mcfarlco'
});

module.exports.pool = pool;
