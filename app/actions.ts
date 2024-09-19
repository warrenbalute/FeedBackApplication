// app/actions.ts
'use server'

import { getIdeasFromDb, addIdeaToDb, initializeDb, authenticateWithLDAP, voteForIdea, removeVoteFromIdea, updateIdeaStatus, addCommentToDb, getCommentsForIdea, getCategories as getCategoriesFromDb } from '../lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    console.log('Initializing database...');
    await initializeDb();
    isInitialized = true;
    console.log('Database initialization complete.');
  }
}

export async function addIdea(formData: FormData) {
  await ensureInitialized();
  const idea = formData.get('idea') as string;
  const description = formData.get('description') as string;
  const categoryId = formData.get('categoryId') as string;
  const userIdCookie = cookies().get('userId');
  if (idea.trim() && userIdCookie && categoryId) {
    await addIdeaToDb(idea.trim(), description.trim(), userIdCookie.value, parseInt(categoryId, 10));
  }
  return getIdeas();
}

export async function getIdeas() {
  await ensureInitialized();
  return getIdeasFromDb();
}

export async function vote(formData: FormData) {
  await ensureInitialized();
  const ideaId = parseInt(formData.get('ideaId') as string);
  const action = formData.get('action') as string;
  const userIdCookie = cookies().get('userId');
  if (ideaId && userIdCookie) {
    if (action === 'vote') {
      await voteForIdea(ideaId, userIdCookie.value);
    } else if (action === 'unvote') {
      await removeVoteFromIdea(ideaId, userIdCookie.value);
    }
  }
  return getIdeas();
}

export async function updateStatus(formData: FormData) {
  await ensureInitialized();
  const ideaId = parseInt(formData.get('ideaId') as string);
  const status = formData.get('status') as 'waiting' | 'in_progress' | 'done';
  const userIdCookie = cookies().get('userId');
  
  if (!userIdCookie) {
    throw new Error('User not authenticated');
  }

  console.log(`Updating status for idea ${ideaId} to ${status}`);
  try {
    await updateIdeaStatus(ideaId, status, userIdCookie.value);
    console.log(`Status updated successfully for idea ${ideaId}`);
  } catch (error) {
    console.error(`Error updating status for idea ${ideaId}:`, error);
    throw error;
  }
  return getIdeas();
}

export async function addComment(formData: FormData) {
  await ensureInitialized();
  const ideaId = parseInt(formData.get('ideaId') as string);
  const content = formData.get('content') as string;
  const userIdCookie = cookies().get('userId');
  
  if (!userIdCookie) {
    throw new Error('User not authenticated');
  }

  if (ideaId && content.trim() && userIdCookie) {
    await addCommentToDb(ideaId, userIdCookie.value, content.trim());
  }
  return getCommentsForIdea(ideaId);
}

export async function getComments(ideaId: number) {
  await ensureInitialized();
  return getCommentsForIdea(ideaId);
}

export async function login(formData: FormData) {
  await ensureInitialized();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  if (!username || !password) {
    return { success: false, error: 'Username and password are required' };
  }

  try {
    const result = await authenticateWithLDAP(username, password);
    if (result.success && result.user) {
      cookies().set('userId', result.user.id);
      cookies().set('username', result.user.username);
      return { success: true, user: result.user };
    } else {
      return { success: false, error: 'Invalid credentials' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}


export async function logout() {
  cookies().delete('userId');
  cookies().delete('username');
  redirect('/');
}

export async function getCurrentUser() {
  await ensureInitialized();
  const userIdCookie = cookies().get('userId');
  const usernameCookie = cookies().get('username');
  if (userIdCookie && usernameCookie) {
    return { id: userIdCookie.value, username: usernameCookie.value };
  }
  return null;
}

export async function getCategories() {
  await ensureInitialized();
  return getCategoriesFromDb();
}