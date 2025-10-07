'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { ShieldCheck, QrCode, XCircle } from 'lucide-react';

export default function TwoFactorAuthSettings() {
  const { user, token } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.two_factor_enabled) {
      setTwoFactorEnabled(true);
    }
  }, [user]);

  const generate2FA = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/2fa', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to generate 2FA secret');
      const data = await response.json();
      setQrCodeUrl(data.qrcodeUrl);
      setSecret(data.secret);
      toast.success('2FA secret generated. Scan the QR code.');
    } catch (error: any) {
      toast.error(error.message || 'Error generating 2FA');
    }
    setLoading(false);
  };

  const verify2FA = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: verificationToken }),
      });
      if (!response.ok) throw new Error('Failed to verify 2FA token');
      await response.json();
      setTwoFactorEnabled(true);
      setQrCodeUrl(null);
      setSecret(null);
      setVerificationToken('');
      toast.success('2FA enabled successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error verifying 2FA');
    }
    setLoading(false);
  };

  const disable2FA = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/2fa', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to disable 2FA');
      await response.json();
      setTwoFactorEnabled(false);
      setQrCodeUrl(null);
      setSecret(null);
      setVerificationToken('');
      toast.success('2FA disabled successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error disabling 2FA');
    }
    setLoading(false);
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription className="text-slate-400">
          Add an extra layer of security to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!twoFactorEnabled && !qrCodeUrl && (
          <Button onClick={generate2FA} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Generating...' : 'Enable 2FA'}
          </Button>
        )}

        {qrCodeUrl && secret && (
          <div className="space-y-4 text-center">
            <p className="text-slate-200">Scan this QR code with your authenticator app:</p>
            <div className="flex justify-center">
              <Image src={qrCodeUrl} alt="QR Code" width={200} height={200} />
            </div>
            <p className="text-slate-400 text-sm">Or enter code manually: <span className="font-mono text-white">{secret}</span></p>
            <div className="space-y-2">
              <Label htmlFor="2fa-token" className="text-slate-200">Verification Code</Label>
              <Input
                id="2fa-token"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 text-center tracking-widest"
              />
            </div>
            <Button onClick={verify2FA} disabled={loading || verificationToken.length !== 6} className="bg-green-600 hover:bg-green-700 w-full">
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </Button>
            <Button onClick={() => { setQrCodeUrl(null); setSecret(null); setVerificationToken(''); }} variant="ghost" className="text-slate-400 hover:text-white w-full">
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}

        {twoFactorEnabled && (
          <div className="space-y-4">
            <p className="text-green-500 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              2FA is currently enabled.
            </p>
            <Button onClick={disable2FA} disabled={loading} variant="destructive" className="w-full">
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}