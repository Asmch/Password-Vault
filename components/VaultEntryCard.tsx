'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff, Edit, Trash2, ExternalLink, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface VaultEntry {
  id: string;
  title: string;
  username: string;
  encrypted_password: string;
  url: string;
  notes: string;
  created_at: string;
  tags: string[];
}

interface VaultEntryCardProps {
  entry: VaultEntry;
  decryptedPassword: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function VaultEntryCard({
  entry,
  decryptedPassword,
  onEdit,
  onDelete,
}: VaultEntryCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          await navigator.clipboard.writeText('');
          if (typeof document !== 'undefined' && document.hasFocus()) {
            toast.info('Clipboard cleared for security');
          }
        } catch (e) {
          // Ignore clipboard clear errors on background tab
        }
        setCopiedField(null);
      }, 15000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card className="h-full glass-panel border-white/5 hover:border-primary/30 shadow-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardContent className="p-6 flex flex-col h-full relative z-10">
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-semibold tracking-tight text-foreground mb-1 leading-tight">{entry.title}</h3>
                {entry.url && (
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1.5 break-all transition-colors inline-flex"
                  >
                    {entry.url}
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                )}
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onEdit}
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 flex-grow">
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/50">
                <div className="flex-1 overflow-hidden mr-3">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Username</p>
                  <p className="text-sm text-foreground font-mono truncate">{entry.username}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard(entry.username, 'Username')}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  {copiedField === 'Username' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/50">
                <div className="flex-1 overflow-hidden mr-3">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Password</p>
                  <p className="text-sm text-foreground font-mono truncate">
                    {showPassword ? decryptedPassword : '••••••••••••'}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(decryptedPassword, 'Password')}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    {copiedField === 'Password' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {entry.notes && (
                <div className="p-3 bg-muted/20 rounded-lg border border-border/30">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{entry.notes}</p>
                </div>
              )}

              {entry.tags && entry.tags.length > 0 && (
                <div className="pt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{entry.title}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
