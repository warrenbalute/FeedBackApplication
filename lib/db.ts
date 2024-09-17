import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import ldap from 'ldapjs'

let db: any = null;

async function openDb() {
  if (db) return db;
  
  db = await open({
    filename: './mydb.sqlite',
    driver: sqlite3.Database
  });
  
  return db;
}

export async function initializeDb() {
  const db = await openDb();
  
  // Drop the existing ideas table if it exists
  await db.exec(`DROP TABLE IF EXISTS ideas`);

  // Create the ideas table with the correct structure
  await db.exec(`
    CREATE TABLE ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idea TEXT NOT NULL,
      description TEXT,
      userId TEXT,
      createdAt TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
}

export async function getIdeasFromDb() {
  const db = await openDb();
  return db.all('SELECT * FROM ideas ORDER BY createdAt DESC');
}

export async function addIdeaToDb(idea: string, description: string, userId: string) {
  const db = await openDb();
  await db.run(
    'INSERT INTO ideas (idea, description, userId, createdAt) VALUES (?, ?, ?, datetime("now","localtime"))',
    idea, description, userId
  );
}

export async function authenticateWithLDAP(username: string, password: string): Promise<{ success: boolean, user?: { id: string, username: string } }> {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: 'ldap://ldap.forumsys.com:389'
    });

    const bindDN = `uid=${username},dc=example,dc=com`;

    client.bind(bindDN, password, (error) => {
      if (error) {
        console.log('LDAP bind failed:', error);
        resolve({ success: false });
      } else {
        console.log('LDAP bind succeeded');
        resolve({ success: true, user: { id: username, username: username } });
      }
      client.unbind();
    });
  });
}