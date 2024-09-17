// lib/db.ts

import mariadb from 'mariadb';
import ldap from 'ldapjs';

const pool = mariadb.createPool({
  host: '127.0.0.1',
  user: 'node_db_user',
  password: 'qwerty123', // Replace with the actual password
  database: 'feedback_app', // Make sure this matches your actual database name
  connectionLimit: 5,
  acquireTimeout: 30000,
  connectTimeout: 30000,
});

async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (err) {
    console.error('Error connecting to the database:', err);
    throw err;
  }
}

export async function initializeDb() {
  let conn;
  try {
    conn = await getConnection();
    
    // Create ideas table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ideas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        idea TEXT NOT NULL,
        description TEXT,
        userId VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        votes INT DEFAULT 0
      )
    `);

    // Create votes table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ideaId INT,
        userId VARCHAR(100),
        UNIQUE KEY (ideaId, userId),
        FOREIGN KEY (ideaId) REFERENCES ideas(id) ON DELETE CASCADE
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

export async function getIdeasFromDb() {
  let conn;
  try {
    conn = await getConnection();
    const ideas = await conn.query(`
      SELECT i.*, COUNT(v.id) as voteCount 
      FROM ideas i 
      LEFT JOIN votes v ON i.id = v.ideaId 
      GROUP BY i.id 
      ORDER BY i.createdAt DESC
    `);
    console.log('Fetched ideas:', ideas); // Add this line for debugging
    return ideas;
  } finally {
    if (conn) conn.release();
  }
}

export async function addIdeaToDb(idea: string, description: string, userId: string) {
  let conn;
  try {
    conn = await getConnection();
    await conn.query(
      'INSERT INTO ideas (idea, description, userId) VALUES (?, ?, ?)',
      [idea, description, userId]
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function voteForIdea(ideaId: number, userId: string) {
  let conn;
  try {
    conn = await getConnection();
    await conn.query('START TRANSACTION');
    
    const [existingVote] = await conn.query(
      'SELECT id FROM votes WHERE ideaId = ? AND userId = ?',
      [ideaId, userId]
    );

    if (!existingVote) {
      await conn.query(
        'INSERT INTO votes (ideaId, userId) VALUES (?, ?)',
        [ideaId, userId]
      );
      await conn.query(
        'UPDATE ideas SET votes = votes + 1 WHERE id = ?',
        [ideaId]
      );
    }

    await conn.query('COMMIT');
  } catch (error) {
    if (conn) await conn.query('ROLLBACK');
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

export async function removeVoteFromIdea(ideaId: number, userId: string) {
  let conn;
  try {
    conn = await getConnection();
    await conn.query('START TRANSACTION');
    
    const [existingVote] = await conn.query(
      'SELECT id FROM votes WHERE ideaId = ? AND userId = ?',
      [ideaId, userId]
    );

    if (existingVote) {
      await conn.query(
        'DELETE FROM votes WHERE ideaId = ? AND userId = ?',
        [ideaId, userId]
      );
      await conn.query(
        'UPDATE ideas SET votes = votes - 1 WHERE id = ?',
        [ideaId]
      );
    }

    await conn.query('COMMIT');
  } catch (error) {
    if (conn) await conn.query('ROLLBACK');
    throw error;
  } finally {
    if (conn) conn.release();
  }
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