import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { updateProfilePicture } from '@/lib/db'
import { writeFile } from 'fs/promises'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: Request) {
  console.log('Profile picture upload route hit');

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.log('Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    console.log('No file uploaded');
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = Date.now() + '_' + file.name.replaceAll(' ', '_');
  
  // Ensure the uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  
  const filepath = path.join(uploadsDir, filename);

  try {
    await writeFile(filepath, buffer);
    const profilePictureUrl = `/uploads/${filename}`;
    await updateProfilePicture(session.user.id, profilePictureUrl);

    console.log('Profile picture uploaded successfully');
    return NextResponse.json({ success: true, profilePictureUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}