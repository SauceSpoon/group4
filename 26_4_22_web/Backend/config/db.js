const mysql = require('mysql2/promise');

let pool = null;

exports.connectDB = async () => {
  if (pool) return pool;
  
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  console.log('✅ MySQL 连接成功');
  return pool;
};

exports.getPool = () => pool;