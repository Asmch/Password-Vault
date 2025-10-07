import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

async function handlePUT(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.user!.userId;
    const { id } = params;
    const { title, username, encrypted_password, url, notes } = await req.json();

    const { data: existingEntry } = await supabase
      .from('vault_entries')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Vault entry not found' },
        { status: 404 }
      );
    }

    const { data: updatedEntry, error } = await supabase
      .from('vault_entries')
      .update({
        title,
        username,
        encrypted_password,
        url: url || '',
        notes: notes || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !updatedEntry) {
      return NextResponse.json(
        { error: 'Failed to update vault entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ entry: updatedEntry });
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
    const userId = req.user!.userId;
    const { id } = params;

    const { error } = await supabase
      .from('vault_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete vault entry' },
        { status: 500 }
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
