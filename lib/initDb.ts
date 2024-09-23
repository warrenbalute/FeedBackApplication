// lib/initDb.ts


import { getConnection } from './db'

async function initializeDatabase() {
  const conn = await getConnection()
  try {
    // Create categories table with a shorter name column
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL
      )
    `)

    // Add a unique index with a shorter key length, if it doesn't exist
    await conn.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_category_name ON categories (name(191))
    `)

    // Create ideas table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ideas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        idea VARCHAR(191) NOT NULL,
        description TEXT,
        userId VARCHAR(191) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('waiting', 'in_progress', 'done') DEFAULT 'waiting',
        categoryId INT,
        voteCount INT DEFAULT 0,
        FOREIGN KEY (categoryId) REFERENCES categories(id)
      )
    `)

    // Create comments table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ideaId INT NOT NULL,
        userId VARCHAR(191) NOT NULL,
        content TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ideaId) REFERENCES ideas(id)
      )
    `)

    // Create votes table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ideaId INT NOT NULL,
        userId VARCHAR(191) NOT NULL,
        voteType ENUM('upvote', 'downvote') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ideaId) REFERENCES ideas(id),
        UNIQUE KEY unique_vote (ideaId, userId)
      )
    `)

    // Insert some default categories
    await conn.query(`
      INSERT IGNORE INTO categories (name) VALUES 
      ('General'), 
      ('Feature Request'), 
      ('Bug Report'),
      ('APR')
    `)

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error // Re-throw the error to be handled by the caller
  } finally {
    conn.release()
  }
}

export { initializeDatabase }