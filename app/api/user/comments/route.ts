// app/api/user/comments/route.ts

import { NextResponse } from 'next/server'
import { getUserComments } from '@/lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: Request) {
  console.log('Fetching comments - Start');
  const session = await getServerSession(authOptions);
  console.log('Session:', session);

  if (!session || !session.user) {
    console.log('Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const userId = session.user.id;
  console.log(`Fetching comments for user ${userId}, page ${page}`);

  try {
    const comments = await getUserComments(userId, page);
    console.log(`Retrieved ${comments.length} comments`);
    return NextResponse.json({ comments, endReached: comments.length === 0 });
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}