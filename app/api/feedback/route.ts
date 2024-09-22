//app/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { voteForIdea, getIdeasFromDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { ideaId, userId, voteType } = await request.json();
    await voteForIdea(Number(ideaId), userId, voteType as 'upvote' | 'downvote');
    const updatedIdeas = await getIdeasFromDb();
    return NextResponse.json(updatedIdeas);
  } catch (error) {
    console.error('Error in POST /api/feedback route:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}