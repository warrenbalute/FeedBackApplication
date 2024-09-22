//app/api/ideas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getIdeasFromDb, addIdeaToDb } from '@/lib/db';

export async function GET() {
  try {
    const ideas = await getIdeasFromDb();
    return NextResponse.json(ideas);
  } catch (error) {
    console.error('Error in GET /api/ideas route:', error);
    return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { idea, description, userId, categoryId } = await request.json();
    await addIdeaToDb(idea, description, userId, Number(categoryId));
    const updatedIdeas = await getIdeasFromDb();
    return NextResponse.json(updatedIdeas);
  } catch (error) {
    console.error('Error in POST /api/ideas route:', error);
    return NextResponse.json({ error: 'Failed to add idea' }, { status: 500 });
  }
}