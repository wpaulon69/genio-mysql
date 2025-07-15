import mysql from 'mysql2/promise';

export const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'your_user',
  password: process.env.MYSQL_PASSWORD || 'your_password',
  database: process.env.MYSQL_DATABASE || 'your_database',
  timezone: '+00:00'
};

export async function getConnection() {
  return await mysql.createConnection(dbConfig);
}
