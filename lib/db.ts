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


export async function getConnection() {
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
    
    // Create categories table if it doesn't exist
    console.log('Creating categories table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(191) NOT NULL UNIQUE
      )
    `);
    console.log('Categories table created or already exists.');

    // Create ideas table if it doesn't exist
    console.log('Creating ideas table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ideas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        idea VARCHAR(255) NOT NULL,
        description TEXT,
        userId VARCHAR(191) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('waiting', 'in_progress', 'done') DEFAULT 'waiting',
        categoryId INT,
        voteCount INT DEFAULT 0
      )
    `);
    console.log('Ideas table created or already exists.');

    // Create votes table if it doesn't exist
    console.log('Creating votes table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ideaId INT NOT NULL,
        userId VARCHAR(191) NOT NULL,
        FOREIGN KEY (ideaId) REFERENCES ideas(id),
        UNIQUE KEY unique_vote (ideaId, userId)
      )
    `);
    console.log('Votes table created or already exists.');

    // Create comments table if it doesn't exist
    console.log('Creating comments table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ideaId INT NOT NULL,
        userId VARCHAR(191) NOT NULL,
        content TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ideaId) REFERENCES ideas(id)
      )
    `);
    console.log('Comments table created or already exists.');

    // Check if the foreign key constraint already exists
    const [existingConstraint] = await conn.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE CONSTRAINT_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'ideas' 
      AND CONSTRAINT_NAME = 'fk_category'
    `);

    if (!existingConstraint) {
      // Update any NULL categoryId values to a default category
      await conn.query(`
        UPDATE ideas 
        SET categoryId = (SELECT id FROM categories WHERE name = 'Other') 
        WHERE categoryId IS NULL
      `);

      // Add foreign key constraint to ideas table
      console.log('Adding foreign key constraint to ideas table...');
      await conn.query(`
        ALTER TABLE ideas
        ADD CONSTRAINT fk_category
        FOREIGN KEY (categoryId) REFERENCES categories(id)
      `);
      console.log('Foreign key constraint added to ideas table.');
    } else {
      console.log('Foreign key constraint already exists on ideas table.');
    }

    await populateCategories();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

async function populateCategories() {
  const initialCategories = [
    'Feature Request',
    'Bug Report',
    'Performance Improvement',
    'Documentation',
    'Other',
    'APR'
  ];

  let conn;
  try {
    conn = await getConnection();
    for (const category of initialCategories) {
      await conn.query(
        'INSERT IGNORE INTO categories (name) VALUES (?)',
        [category]
      );
    }
    console.log('Categories populated successfully');
  } catch (error) {
    console.error('Error populating categories:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

export async function getCategories() {
  let conn;
  try {
    conn = await getConnection();
    const categories = await conn.query('SELECT * FROM categories');
    return categories;
  } finally {
    if (conn) conn.release();
  }
}

export async function getIdeasFromDb() {
  let conn;
  try {
    conn = await getConnection();
    const ideas = await conn.query(`
      SELECT i.id, i.idea, i.description, i.userId, i.createdAt, i.status, i.categoryId, i.voteCount, 
             c.name as categoryName, COUNT(com.id) as commentCount
      FROM ideas i 
      LEFT JOIN categories c ON i.categoryId = c.id
      LEFT JOIN comments com ON i.id = com.ideaId
      GROUP BY i.id
      ORDER BY 
        CASE 
          WHEN i.status = 'waiting' THEN 1
          WHEN i.status = 'in_progress' THEN 2
          WHEN i.status = 'done' THEN 3
        END,
        i.createdAt DESC
    `);
    return ideas;
  } finally {
    if (conn) conn.release();
  }
}

export async function addIdeaToDb(idea: string, description: string, userId: string, categoryId: number) {
  let conn;
  try {
    conn = await getConnection();
    await conn.query(
      'INSERT INTO ideas (idea, description, userId, categoryId) VALUES (?, ?, ?, ?)',
      [idea, description, userId.substring(0, 191), categoryId]
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
      [ideaId, userId.substring(0, 191)]
    );

    if (!existingVote) {
      await conn.query(
        'INSERT INTO votes (ideaId, userId) VALUES (?, ?)',
        [ideaId, userId.substring(0, 191)]
      );
      await conn.query(
        'UPDATE ideas SET voteCount = voteCount + 1 WHERE id = ?',
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
      [ideaId, userId.substring(0, 191)]
    );

    if (existingVote) {
      await conn.query(
        'DELETE FROM votes WHERE ideaId = ? AND userId = ?',
        [ideaId, userId.substring(0, 191)]
      );
      await conn.query(
        'UPDATE ideas SET voteCount = GREATEST(voteCount - 1, 0) WHERE id = ?',
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

export async function updateIdeaStatus(ideaId: number, status: 'waiting' | 'in_progress' | 'done', userId: string) {
  let conn;
  try {
    conn = await getConnection();
    console.log(`Updating status for idea ${ideaId} to ${status}`);
    
    // Check if the user is the creator of the idea
    const [idea] = await conn.query(
      'SELECT userId FROM ideas WHERE id = ?',
      [ideaId]
    );

    if (idea && idea.userId === userId.substring(0, 191)) {
      await conn.query(
        'UPDATE ideas SET status = ? WHERE id = ?',
        [status, ideaId]
      );
      console.log(`Status updated successfully for idea ${ideaId}`);
    } else {
      console.log(`User ${userId.substring(0, 191)} is not authorized to update status for idea ${ideaId}`);
      throw new Error('Unauthorized to update status');
    }
  } catch (error) {
    console.error(`Error updating status for idea ${ideaId}:`, error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

export async function addCommentToDb(ideaId: number, userId: string, content: string) {
  let conn;
  try {
    conn = await getConnection();
    await conn.query(
      'INSERT INTO comments (ideaId, userId, content) VALUES (?, ?, ?)',
      [ideaId, userId.substring(0, 191), content]
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function getCommentsForIdea(ideaId: number) {
  let conn;
  try {
    conn = await getConnection();
    const comments = await conn.query(
      'SELECT * FROM comments WHERE ideaId = ? ORDER BY createdAt DESC',
      [ideaId]
    );
    return comments;
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

    client.on('error', (err) => {
      console.log('LDAP connection error:', err);
      resolve({ success: false, error: 'Invalid credentials' });
    });
    
  });
}