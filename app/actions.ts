'use server'

import { getIdeasFromDb, addIdeaToDb, initializeDb, authenticateWithLDAP } from '../lib/db'
import { cookies } from 'next/headers'

let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    await initializeDb();
    isInitialized = true;
  }
}

export async function addIdea(formData: FormData) {
  await ensureInitialized();
  const idea = formData.get('idea') as string;
  const description = formData.get('description') as string;
  const userIdCookie = cookies().get('userId');
  if (idea.trim() && userIdCookie) {
    await addIdeaToDb(idea.trim(), description.trim(), userIdCookie.value);
  }
  return getIdeas();
}

export async function getIdeas() {
  await ensureInitialized();
  return getIdeasFromDb();
}

export async function login(formData: FormData) {
  await ensureInitialized();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  if (username && password) {
    const result = await authenticateWithLDAP(username, password);
    if (result.success && result.user) {
      cookies().set('userId', result.user.id);
      cookies().set('username', result.user.username);
      return true;
    }
  }
  return false;
}

export async function logout() {
  cookies().delete('userId');
  cookies().delete('username');
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