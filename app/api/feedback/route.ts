//app/feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { voteForIdea, getIdeaById, getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ideaId, voteType } = await request.json()
    const userId = session.user.id

    const conn = await getConnection()

    // Start transaction
    await conn.beginTransaction()

    try {
      // Delete existing vote if any
      await conn.query('DELETE FROM votes WHERE ideaId = ? AND userId = ?', [ideaId, userId])

      // Insert new vote if not 'unvote'
      if (voteType !== 'unvote') {
        await conn.query('INSERT INTO votes (ideaId, userId, voteType) VALUES (?, ?, ?)', [ideaId, userId, voteType])
      }

      // Update voteCount in ideas table
      await conn.query('UPDATE ideas SET voteCount = (SELECT COUNT(*) FROM votes WHERE ideaId = ?) WHERE id = ?', [ideaId, ideaId])

      // Fetch updated idea
      const [updatedIdeas] = await conn.query(`
        SELECT 
          i.*,
          c.name as categoryName,
          (SELECT COUNT(*) FROM comments WHERE ideaId = i.id) as commentCount,
          COALESCE((SELECT voteType FROM votes WHERE ideaId = i.id AND userId = ?), 'none') as userVote
        FROM 
          ideas i
        LEFT JOIN 
          categories c ON i.categoryId = c.id
        WHERE 
          i.id = ?
      `, [userId, ideaId])

      // Commit transaction
      await conn.commit()

      return NextResponse.json(updatedIdeas[0])
    } catch (error) {
      // Rollback transaction on error
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  } catch (error) {
    console.error('Error in POST /api/feedback:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}