import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

async function handleGET(req: AuthenticatedRequest) {
  try {
    const userId = req.user!.userId;

    const { data: entries, error } = await supabase
      .from('vault_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch vault entries' },
        { status: 500 }
      );
    }

    return NextResponse.json({ entries: entries || [] });
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
    const userId = req.user!.userId;
    const { title, username, encrypted_password, url, notes } = await req.json();

    if (!title || !username || !encrypted_password) {
      return NextResponse.json(
        { error: 'Title, username, and password are required' },
        { status: 400 }
      );
    }

    const { data: newEntry, error } = await supabase
      .from('vault_entries')
      .insert([
        {
          user_id: userId,
          title,
          username,
          encrypted_password,
          url: url || '',
          notes: notes || '',
        },
      ])
      .select()
      .single();

    if (error || !newEntry) {
      return NextResponse.json(
        { error: 'Failed to create vault entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ entry: newEntry }, { status: 201 });
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
