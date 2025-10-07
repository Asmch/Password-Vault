import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VaultEntry from '@/models/VaultEntry';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

async function handleGET(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user!.userId;

    const entries = await VaultEntry.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedEntries = entries.map((entry: any) => ({
      id: String(entry._id),
      title: entry.title,
      username: entry.username,
      encrypted_password: entry.encrypted_password,
      url: entry.url,
      notes: entry.notes,
      tags: entry.tags || [],
      created_at: entry.createdAt,
    }));

    return NextResponse.json({ entries: formattedEntries });
  } catch (error) {
    console.error('Vault GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePOST(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user!.userId;
    const { title, username, encrypted_password, url, notes, tags } = await req.json();

    if (!title || !username || !encrypted_password) {
      return NextResponse.json(
        { error: 'Title, username, and password are required' },
        { status: 400 }
      );
    }

    const newEntry = await VaultEntry.create({
      user_id: userId,
      title,
      username,
      encrypted_password,
      url: url || '',
      notes: notes || '',
      tags: tags || [],
    });

    return NextResponse.json(
      {
        entry: {
          id: String(newEntry._id),
          title: newEntry.title,
          username: newEntry.username,
          encrypted_password: newEntry.encrypted_password,
          url: newEntry.url,
          notes: newEntry.notes,
          created_at: newEntry.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Vault POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);
