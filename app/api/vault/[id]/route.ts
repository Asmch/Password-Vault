import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VaultEntry from '@/models/VaultEntry';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import mongoose from 'mongoose';

async function handlePUT(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const userId = req.user!.userId;
    const { id } = params;
    const { title, username, encrypted_password, url, notes } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      );
    }

    const existingEntry = await VaultEntry.findOne({
      _id: id,
      user_id: userId,
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Vault entry not found' },
        { status: 404 }
      );
    }

    const updatedEntry = await VaultEntry.findOneAndUpdate(
      { _id: id, user_id: userId },
      {
        title,
        username,
        encrypted_password,
        url: url || '',
        notes: notes || '',
      },
      { new: true }
    );

    if (!updatedEntry) {
      return NextResponse.json(
        { error: 'Failed to update vault entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entry: {
        id: String(updatedEntry._id),
        title: updatedEntry.title,
        username: updatedEntry.username,
        encrypted_password: updatedEntry.encrypted_password,
        url: updatedEntry.url,
        notes: updatedEntry.notes,
        created_at: updatedEntry.createdAt,
      },
    });
  } catch (error) {
    console.error('Vault PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleDELETE(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const userId = req.user!.userId;
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      );
    }

    const result = await VaultEntry.findOneAndDelete({
      _id: id,
      user_id: userId,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Vault entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Vault DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(handlePUT);
export const DELETE = withAuth(handleDELETE);
