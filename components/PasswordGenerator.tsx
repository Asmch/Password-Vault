'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface PasswordGeneratorProps {
  onUsePassword?: (password: string) => void;
}

export default function PasswordGenerator({ onUsePassword }: PasswordGeneratorProps) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeLookAlikes, setExcludeLookAlikes] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeLookAlikes) {
      const lookAlikes = '0O1lI'; // Define common look-alike characters
      charset = charset.split('').filter(char => !lookAlikes.includes(char)).join('');
    }

    if (charset === '') {
      toast.error('Please select at least one character type');
      return;
    }

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setPassword(newPassword);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (!password) {
      toast.error('Generate a password first');
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success('Password copied to clipboard!');

      setTimeout(async () => {
        await navigator.clipboard.writeText('');
        toast.info('Clipboard cleared for security');
      }, 15000);
    } catch (error) {
      toast.error('Failed to copy password');
    }
  };

  const handleUsePassword = () => {
    if (!password) {
      toast.error('Generate a password first');
      return;
    }
    onUsePassword?.(password);
    toast.success('Password applied!');
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Password Generator
        </CardTitle>
        <CardDescription className="text-slate-400">
          Generate strong, secure passwords
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 min-h-[60px] flex items-center justify-between">
            <AnimatePresence mode="wait">
              {password ? (
                <motion.span
                  key="password"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-lg text-white break-all"
                >
                  {password}
                </motion.span>
              ) : (
                <motion.span
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-slate-500"
                >
                  Click generate to create a password
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2">
            <Button onClick={generatePassword} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="border-slate-600 bg-slate-900/50 text-white hover:bg-slate-700"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            {onUsePassword && (
              <Button
                onClick={handleUsePassword}
                variant="outline"
                className="border-slate-600 bg-slate-900/50 text-white hover:bg-slate-700"
              >
                Use
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-200">Length: {length}</Label>
            </div>
            <Slider
              value={[length]}
              onValueChange={(value) => setLength(value[0])}
              min={8}
              max={32}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="uppercase" className="text-slate-200">
                Uppercase Letters
              </Label>
              <Switch
                id="uppercase"
                checked={includeUppercase}
                onCheckedChange={setIncludeUppercase}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="lowercase" className="text-slate-200">
                Lowercase Letters
              </Label>
              <Switch
                id="lowercase"
                checked={includeLowercase}
                onCheckedChange={setIncludeLowercase}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="numbers" className="text-slate-200">
                Numbers
              </Label>
              <Switch
                id="numbers"
                checked={includeNumbers}
                onCheckedChange={setIncludeNumbers}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="symbols" className="text-slate-200">
                Symbols
              </Label>
              <Switch
                id="symbols"
                checked={includeSymbols}
                onCheckedChange={setIncludeSymbols}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="lookalikes" className="text-slate-200">
                Exclude Look-alikes (e.g., O, 0, I, l)
              </Label>
              <Switch
                id="lookalikes"
                checked={excludeLookAlikes}
                onCheckedChange={setExcludeLookAlikes}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
