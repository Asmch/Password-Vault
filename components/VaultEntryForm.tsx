'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Lock, Globe, User, FileText, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import PasswordGenerator from './PasswordGenerator';
import { checkPasswordBreach } from '@/lib/hibp';

interface VaultEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VaultEntryData) => Promise<void>;
  initialData?: VaultEntryData;
  mode: 'create' | 'edit';
}

export interface VaultEntryData {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  tags: string[];
}

export default function VaultEntryForm({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
}: VaultEntryFormProps) {
  const [formData, setFormData] = useState<VaultEntryData>({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [breachCount, setBreachCount] = useState<number | null>(null);
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  // Debounced HIBP Breach Check
  useEffect(() => {
    const password = formData.password;
    if (password.length < 8) {
      setBreachCount(null);
      setIsCheckingBreach(false);
      return;
    }

    setIsCheckingBreach(true);
    const timeoutId = setTimeout(async () => {
      try {
        const count = await checkPasswordBreach(password);
        setBreachCount(count);
      } catch (e) {
        setBreachCount(-1); // -1 indicates network failure
      } finally {
        setIsCheckingBreach(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.password]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setTagsInput(initialData.tags?.join(', ') || '');
    } else {
      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        tags: [],
      });
      setTagsInput('');
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.username || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.url) {
      try {
        new URL(formData.url);
      } catch (e) {
        toast.error('Please enter a valid URL (e.g., https://example.com)');
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        tags: [],
      });
      setTagsInput('');
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Failed to save entry. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-panel border-white/10 text-foreground shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'create' ? 'Add New Entry' : 'Edit Entry'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === 'create'
              ? 'Create a new password entry in your vault'
              : 'Update your vault entry'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title *
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="title"
                placeholder="e.g., Gmail, Netflix, GitHub"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="pl-10 bg-input/20 border-white/10 focus:border-primary/50 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">
              Username / Email *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                placeholder="username or email"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="pl-10 bg-input/20 border-white/10 focus:border-primary/50 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">
                Password *
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-primary hover:text-primary/80 h-auto py-1"
              >
                {showGenerator ? 'Hide Generator' : 'Show Generator'}
              </Button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="pl-10 pr-10 bg-input/20 border-white/10 focus:border-primary/50 focus:ring-primary/50 transition-all"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {isCheckingBreach && (
              <p className="text-xs text-muted-foreground mt-1 animate-pulse">Checking password security...</p>
            )}
            {breachCount !== null && !isCheckingBreach && (
              <div className="mt-1">
                {breachCount > 0 && (
                  <p className="text-xs font-medium text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Warning: This password has appeared in {breachCount.toLocaleString()} data breaches. Consider changing it.
                  </p>
                )}
                {breachCount === -1 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Couldn't verify breach status (network issue).
                  </p>
                )}
              </div>
            )}
          </div>

          {showGenerator && (
            <PasswordGenerator
              onUsePassword={(password) => setFormData({ ...formData, password })}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="url">
              Website URL
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="pl-10 bg-input/20 border-white/10 focus:border-primary/50 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or security questions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="bg-input/20 border-white/10 focus:border-primary/50 focus:ring-primary/50 transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">
              Tags (comma-separated)
            </Label>
            <Input
              id="tags"
              placeholder="e.g., work, personal, social"
              value={tagsInput}
              onChange={(e) => {
                setTagsInput(e.target.value);
                setFormData({ ...formData, tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) });
              }}
              className="bg-input/20 border-white/10 focus:border-primary/50 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 font-medium glass-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Entry' : 'Update Entry'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 font-medium"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
