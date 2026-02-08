import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import "dotenv/config";

const { Client } = pg;

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined");
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("Database connection successful!");
    
    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log("Query result:", result.rows[0]);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await client.end();
  }
}

testConnection();