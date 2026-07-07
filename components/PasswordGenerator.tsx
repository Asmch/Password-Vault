'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          if (typeof document !== 'undefined' && document.hasFocus()) {
            await navigator.clipboard.writeText('');
            toast.info('Clipboard cleared for security');
          }
        } catch (e) {
          // ignore
        }
        setCopied(false);
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
            <Button type="button" onClick={generatePassword} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate
            </Button>
            <Button
              type="button"
              onClick={copyToClipboard}
              variant="outline"
              disabled={!password}
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            {onUsePassword && (
              <Button
                type="button"
                onClick={handleUsePassword}
                variant="outline"
              >
                Use
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium">Length</Label>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {length} chars
            </span>
          </div>
          <Slider
            value={[length]}
            onValueChange={(value) => setLength(value[0])}
            min={8}
            max={32}
            step={1}
            className="w-full"
          />

          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="uppercase" className="text-sm">Uppercase Letters</Label>
              <Switch id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="lowercase" className="text-sm">Lowercase Letters</Label>
              <Switch id="lowercase" checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="numbers" className="text-sm">Numbers</Label>
              <Switch id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="symbols" className="text-xs cursor-pointer">Symbols (!@#)</Label>
              <Switch id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="excludeLookAlikes"
                checked={excludeLookAlikes}
                onCheckedChange={(checked: boolean | "indeterminate") => setExcludeLookAlikes(checked === true)}
              />
              <Label htmlFor="excludeLookAlikes" className="text-xs cursor-pointer">No Ambiguous (0O1lI)</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
