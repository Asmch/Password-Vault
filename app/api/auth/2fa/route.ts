import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import User from '@/models/User';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// API to generate 2FA secret and QR code
async function handleGenerate2FA(req: AuthenticatedRequest) {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const secret = speakeasy.generateSecret({
      name: `SecureVault (${user.email})`,
    });

    user.two_factor_secret = secret.base32;
    await user.save();

    const qrcodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    return NextResponse.json({ secret: secret.base32, qrcodeUrl });
  } catch (error) {
    console.error('Generate 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API to verify 2FA token and enable 2FA
async function handleVerify2FA(req: AuthenticatedRequest) {
  try {
    const userId = req.user!.userId;
    const { token } = await req.json();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.two_factor_secret) {
      return NextResponse.json({ error: '2FA not set up' }, { status: 400 });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
    });

    if (verified) {
      user.two_factor_enabled = true;
      await user.save();
      return NextResponse.json({ message: '2FA enabled successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid 2FA token' }, { status: 400 });
    }
  } catch (error) {
    console.error('Verify 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API to disable 2FA
async function handleDisable2FA(req: AuthenticatedRequest) {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.two_factor_secret = undefined;
    user.two_factor_enabled = false;
    await user.save();

    return NextResponse.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGenerate2FA);
export const POST = withAuth(handleVerify2FA);
export const DELETE = withAuth(handleDisable2FA);