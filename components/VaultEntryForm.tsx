'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Lock, Globe, User, FileText, Eye, EyeOff } from 'lucide-react';
import PasswordGenerator from './PasswordGenerator';

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
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        tags: [],
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.username || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
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
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Entry' : 'Edit Entry'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === 'create'
              ? 'Create a new password entry in your vault'
              : 'Update your vault entry'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-200">
              Title *
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="title"
                placeholder="e.g., Gmail, Netflix, GitHub"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-200">
              Username / Email *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="username"
                placeholder="username or email"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-200">
                Password *
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-blue-400 hover:text-blue-300"
              >
                {showGenerator ? 'Hide Generator' : 'Show Generator'}
              </Button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'} // Dynamically change type
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="pl-10 pr-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500" // Added pr-10 for icon space
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {showGenerator && (
            <PasswordGenerator
              onUsePassword={(password) => setFormData({ ...formData, password })}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="url" className="text-slate-200">
              Website URL
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-200">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or security questions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-slate-200">
              Tags (comma-separated)
            </Label>
            <Input
              id="tags"
              placeholder="e.g., work, personal, social"
              value={formData.tags.join(', ')}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })
              }
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Entry' : 'Update Entry'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 bg-slate-900/50 text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
