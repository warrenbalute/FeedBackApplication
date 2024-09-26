// lib/db.ts

import mariadb from 'mariadb';
import ldap from 'ldapjs';

const pool = mariadb.createPool({
  host: '127.0.0.1',
  user: 'node_db_user',
  password: 'qwerty123', // Replace with the actual password
  database: 'feedback_app' // Make sure this matches your actual database name
  //connectionLimit: 5,
  //acquireTimeout: 30000,
  //connectTimeout: 30000,
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
        voteType ENUM('upvote', 'downvote') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ideaId) REFERENCES ideas(id),
        UNIQUE KEY unique_vote (ideaId, userId)
      )
    `);
    console.log('Votes table created or already exists.');

    // Create comments table if it doesn't exist
    console.log('Creating comments table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ideaId INT NOT NULL,
        userId VARCHAR(191) NOT NULL,
        voteType ENUM('upvote', 'downvote') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ideaId) REFERENCES ideas(id),
        UNIQUE KEY unique_vote (ideaId, userId)
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

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        userId VARCHAR(191) PRIMARY KEY,
        profilePictureUrl VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

export async function getIdeasFromDb(userId?: string) {
  let conn;
  try {
    conn = await getConnection();
    const query = `
      SELECT i.id, i.idea, i.description, i.userId, i.createdAt, i.status, i.categoryId, i.voteCount, 
             COALESCE(c.name, 'Uncategorized') as categoryName, COUNT(com.id) as commentCount,
             CASE WHEN v.userId IS NOT NULL THEN TRUE ELSE FALSE END as userHasVoted
      FROM ideas i 
      LEFT JOIN categories c ON i.categoryId = c.id
      LEFT JOIN comments com ON i.id = com.ideaId
      LEFT JOIN votes v ON i.id = v.ideaId AND v.userId = ?
      GROUP BY i.id, i.idea, i.description, i.userId, i.createdAt, i.status, i.categoryId, i.voteCount, c.name, v.userId
      ORDER BY 
        CASE 
          WHEN i.status = 'waiting' THEN 1
          WHEN i.status = 'in_progress' THEN 2
          WHEN i.status = 'done' THEN 3
        END,
        i.createdAt DESC
    `;
    
    const ideas = await conn.query(query, [userId || null]);
    
    // Convert BigInt values to regular numbers and boolean to boolean
    const serializedIdeas = ideas.map((idea: any) => ({
      ...idea,
      id: Number(idea.id),
      categoryId: idea.categoryId ? Number(idea.categoryId) : null,
      voteCount: Number(idea.voteCount),
      commentCount: Number(idea.commentCount),
      userHasVoted: Boolean(idea.userHasVoted)
    }));
    
    return serializedIdeas;
  } catch (error) {
    console.error('Error in getIdeasFromDb:', error);
    throw error;
  } finally {
    if (conn) {
      await conn.release();
      console.log('Database connection released');
    }
  }
}

export async function addIdeaToDb(idea: string, description: string, userId: string, categoryId: number | null) {
  let conn;
  try {
    conn = await getConnection();
    
    // If no category is provided, use a default category (e.g., 'Other')
    if (!categoryId === null) {
      const [defaultCategory] = await conn.query('SELECT id FROM categories WHERE name = ?', ['Other']);
      categoryId = defaultCategory ? Number(defaultCategory.id) : null;
    }

    const result = await conn.query(
      'INSERT INTO ideas (idea, description, userId, categoryId) VALUES (?, ?, ?, ?)',
      [idea, description, userId.substring(0, 191), categoryId]
    );
    console.log('Idea added successfully:', result.insertId);
    return Number(result.insertId);
  } catch (error) {
    console.error('Error in addIdeaToDb:', error);
    throw error;
  } finally {
    if (conn) {
      await conn.release();
      console.log('Database connection released');
    }
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

export async function getIdeaById(ideaId: number) {
  const conn = await getConnection();
  try {
    const [idea] = await conn.query(`
      SELECT i.*, c.name as categoryName,
             (SELECT COUNT(*) FROM comments WHERE ideaId = i.id) as commentCount
      FROM ideas i
      LEFT JOIN categories c ON i.categoryId = c.id
      WHERE i.id = ?
    `, [ideaId]);
    return idea;
  } finally {
    conn.release();
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

export async function getUserIdeas(userId: string, page = 1, pageSize = 10) {
  console.log(`getUserIdeas called with userId: ${userId}, page: ${page}, pageSize: ${pageSize}`);
  let conn;
  try {
    conn = await getConnection();
    const offset = (page - 1) * pageSize;
    const query = `
      SELECT i.*, c.name as categoryName, COUNT(com.id) as commentCount
      FROM ideas i 
      LEFT JOIN categories c ON i.categoryId = c.id
      LEFT JOIN comments com ON i.id = com.ideaId
      WHERE i.userId = ?
      GROUP BY i.id
      ORDER BY i.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    console.log('Executing query:', query);
    console.log('Query parameters:', [userId, pageSize, offset]);
    const ideas = await conn.query(query, [userId, pageSize, offset]);
    console.log(`Retrieved ${ideas.length} ideas from database`);
    return ideas.map((idea: any) => ({
      ...idea,
      id: Number(idea.id),
      categoryId: idea.categoryId ? Number(idea.categoryId) : null,
      voteCount: Number(idea.voteCount),
      commentCount: Number(idea.commentCount)
    }));
  } catch (error) {
    console.error('Error in getUserIdeas:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

export async function getUserComments(userId: string, page = 1, pageSize = 10) {
  console.log(`getUserComments called with userId: ${userId}, page: ${page}, pageSize: ${pageSize}`);
  let conn;
  try {
    conn = await getConnection();
    const offset = (page - 1) * pageSize;
    const query = `
      SELECT c.*, i.idea as ideaTitle
      FROM comments c
      JOIN ideas i ON c.ideaId = i.id
      WHERE c.userId = ?
      ORDER BY c.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    console.log('Executing query:', query);
    console.log('Query parameters:', [userId, pageSize, offset]);
    const comments = await conn.query(query, [userId, pageSize, offset]);
    console.log(`Retrieved ${comments.length} comments from database`);
    return comments.map((comment: any) => ({
      ...comment,
      id: Number(comment.id),
      ideaId: Number(comment.ideaId)
    }));
  } catch (error) {
    console.error('Error in getUserComments:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}


export async function updateProfilePicture(userId: string, profilePictureUrl: string) {
  let conn;
  try {
    conn = await getConnection();
    await conn.query('INSERT INTO user_profiles (userId, profilePictureUrl) VALUES (?, ?) ON DUPLICATE KEY UPDATE profilePictureUrl = ?', [userId, profilePictureUrl, profilePictureUrl]);
    console.log('Profile picture URL updated in database');
  } catch (error) {
    console.error('Error updating profile picture in database:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

export async function getProfilePicture(userId: string): Promise<string | null> {
  let conn;
  try {
    conn = await getConnection();
    const [profile] = await conn.query('SELECT profilePictureUrl FROM user_profiles WHERE userId = ?', [userId]);
    return profile ? profile.profilePictureUrl : null;
  } finally {
    if (conn) conn.release();
  }
}

export async function authenticateWithLDAP(username: string, password: string): Promise<{ success: boolean, user?: { id: string, username: string, profilePictureUrl?: string } }> {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: 'ldap://ldap.forumsys.com:389'
    });

    const bindDN = `uid=${username},dc=example,dc=com`;

    client.bind(bindDN, password, async (error) => {
      if (error) {
        console.log('LDAP bind failed:', error);
        resolve({ success: false });
      } else {
        console.log('LDAP bind succeeded');
        const userProfile = await getOrCreateUserProfile(username);
        resolve({ 
          success: true, 
          user: { 
            id: username, 
            username: username, 
            profilePictureUrl: userProfile.profilePictureUrl 
          } 
        });
      }
      client.unbind();
    });

    client.on('error', (err) => {
      console.log('LDAP connection error:', err);
      resolve({ success: false });
    });
  });
}

async function getOrCreateUserProfile(userId: string) {
  let conn;
  try {
    conn = await getConnection();
    const [existingProfile] = await conn.query('SELECT * FROM user_profiles WHERE userId = ?', [userId]);
    if (existingProfile) {
      return existingProfile;
    } else {
      await conn.query('INSERT INTO user_profiles (userId) VALUES (?)', [userId]);
      return { userId, profilePictureUrl: null };
    }
  } finally {
    if (conn) conn.release();
  }
}