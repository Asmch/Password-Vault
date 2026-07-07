'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VaultEntryCard from '@/components/VaultEntryCard';
import VaultEntryForm, { VaultEntryData } from '@/components/VaultEntryForm';
import { toast } from 'sonner';
import { Plus, Search, LogOut, Shield, Key, Download, Upload } from 'lucide-react';
import { encryptText, decryptText, generateEncryptionKey } from '@/lib/crypto';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import TwoFactorAuthSettings from '@/components/TwoFactorAuthSettings';
import { Badge } from '@/components/ui/badge';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { useCallback } from 'react';

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

interface ExportedVaultData {
  version: number;
  timestamp: string;
  entries: Omit<VaultEntry, 'encrypted_password' | 'created_at'> & { password: string };
}

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<VaultEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [masterKey, setMasterKey] = useState('');
  const [showMasterKeyDialog, setShowMasterKeyDialog] = useState(false);
  const [showTwoFactorSettings, setShowTwoFactorSettings] = useState(false);
  const [tempMasterKey, setTempMasterKey] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    if (token) {
      const storedMasterKey = localStorage.getItem('masterKey');
      if (storedMasterKey) {
        setMasterKey(storedMasterKey);
        fetchEntries();
      } else {
        setShowMasterKeyDialog(true);
        setLoading(false);
      }
    }
  }, [token]);

  const handleIdle = useCallback(() => {
    setMasterKey('');
    localStorage.removeItem('masterKey');
    setShowForm(false);
    setEditingEntry(null);
    setShowImportDialog(false);
    setShowTwoFactorSettings(false);
    setTempMasterKey('');
    setShowMasterKeyDialog(true);
    toast.info('Vault locked due to inactivity.', { duration: 5000 });
  }, []);

  useInactivityTimer({
    timeoutMs: 5 * 60 * 1000,
    onIdle: handleIdle,
    isActive: !!masterKey && !showMasterKeyDialog,
  });

  useEffect(() => {
    let currentFilteredEntries = entries;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      currentFilteredEntries = currentFilteredEntries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(query) ||
          entry.username.toLowerCase().includes(query) ||
          entry.url.toLowerCase().includes(query)
      );
    }

    if (selectedTags.length > 0) {
      currentFilteredEntries = currentFilteredEntries.filter((entry) =>
        selectedTags.every((tag) => entry.tags?.includes(tag))
      );
    }

    setFilteredEntries(currentFilteredEntries);
  }, [searchQuery, entries, selectedTags]);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/vault', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`Failed to fetch entries: ${response.status} ${response.statusText} - ${errorData.message}`);
      }

      const data = await response.json();
      setEntries(data.entries);
      setFilteredEntries(data.entries);

      const allTags = new Set<string>();
      data.entries.forEach((entry: VaultEntry) => {
        entry.tags?.forEach((tag) => allTags.add(tag));
      });
      setAvailableTags(Array.from(allTags));
    } catch (error: any) {
      toast.error(error.message || 'Failed to load vault entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSetMasterKey = () => {
    if (tempMasterKey.length < 8) {
      toast.error('Master key must be at least 8 characters');
      return;
    }
    setMasterKey(tempMasterKey);
    localStorage.setItem('masterKey', tempMasterKey);
    setShowMasterKeyDialog(false);
    fetchEntries();
    toast.success('Master key set successfully!');
  };

  const handleCreateEntry = async (data: VaultEntryData) => {
    try {
      const encryptionKey = generateEncryptionKey(user!.id, masterKey);
      const encryptedPassword = encryptText(data.password, encryptionKey);

      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          username: data.username,
          encrypted_password: encryptedPassword,
          url: data.url,
          notes: data.notes,
          tags: data.tags,
        }),
      });

      if (!response.ok) throw new Error('Failed to create entry');

      toast.success('Entry created successfully!');
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create entry');
    }
  };

  const handleUpdateEntry = async (data: VaultEntryData) => {
    if (!editingEntry) return;

    try {
      const encryptionKey = generateEncryptionKey(user!.id, masterKey);
      const encryptedPassword = encryptText(data.password, encryptionKey);

      const response = await fetch(`/api/vault/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          username: data.username,
          encrypted_password: encryptedPassword,
          url: data.url,
          notes: data.notes,
          tags: data.tags,
        }),
      });

      if (!response.ok) throw new Error('Failed to update entry');

      toast.success('Entry updated successfully!');
      setEditingEntry(null);
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/vault/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete entry');

      toast.success('Entry deleted successfully!');
      fetchEntries();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete entry');
    }
  };

  const decryptPassword = (encryptedPassword: string): string => {
    try {
      const encryptionKey = generateEncryptionKey(user!.id, masterKey);
      return decryptText(encryptedPassword, encryptionKey);
    } catch (error) {
      return '[Decryption Error]';
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleExportVault = async () => {
    if (!masterKey) {
      toast.error('Master key is not set. Please set it to export your vault.');
      return;
    }

    try {
      const encryptionKey = generateEncryptionKey(user!.id, masterKey);
      const decryptedEntries = entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        username: entry.username,
        password: decryptText(entry.encrypted_password, encryptionKey),
        url: entry.url,
        notes: entry.notes ? decryptText(entry.notes, encryptionKey) : '',
        tags: entry.tags,
      }));

      const exportData = {
        version: 1,
        timestamp: new Date().toISOString(),
        entries: decryptedEntries,
      };

      const encryptedExportData = encryptText(JSON.stringify(exportData), encryptionKey);

      const blob = new Blob([encryptedExportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `securevault_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Vault exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export vault. Make sure your master key is correct.');
    }
  };

  const handleImportVault = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!masterKey) {
      toast.error('Master key is not set. Please set it to import your vault.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      toast.error('No file selected.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const encryptedData = e.target?.result as string;
        const encryptionKey = generateEncryptionKey(user!.id, masterKey);
        const decryptedDataString = decryptText(encryptedData, encryptionKey);
        const importedData: ExportedVaultData = JSON.parse(decryptedDataString);

        if (importedData.version !== 1 || !Array.isArray(importedData.entries)) {
          throw new Error('Invalid vault file format.');
        }

        for (const entry of importedData.entries) {
          const encryptedPassword = encryptText(entry.password, encryptionKey);
          const encryptedNotes = entry.notes ? encryptText(entry.notes, encryptionKey) : '';

          await fetch('/api/vault', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: entry.title,
              username: entry.username,
              encrypted_password: encryptedPassword,
              url: entry.url,
              notes: encryptedNotes,
              tags: entry.tags,
            }),
          });
        }

        toast.success('Vault imported successfully!');
        setShowImportDialog(false);
        fetchEntries();
      } catch (error: any) {
        console.error('Import failed:', error);
        toast.error(error.message || 'Failed to import vault. Make sure your master key is correct and the file is valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <div className="pt-6 px-4 mb-4 z-40 relative">
          <nav className="glass-panel max-w-4xl mx-auto rounded-full px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.2)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Shield className="w-5 h-5 text-primary relative z-10" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white">SecureVault</h1>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-full px-4"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </nav>
        </div>

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-1">Your Vault</h2>
                <p className="text-muted-foreground text-sm">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'} encrypted & stored securely
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setShowForm(true)}
                  className="font-medium glass-button rounded-full px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
                <Button
                  onClick={() => setShowTwoFactorSettings(true)}
                  variant="outline"
                  className="font-medium relative"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  2FA Settings
                  {user?.two_factor_enabled && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></span>
                  )}
                </Button>
                <Button
                  onClick={handleExportVault}
                  variant="outline"
                  className="font-medium"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Vault
                </Button>
                <Button
                  onClick={() => setShowImportDialog(true)}
                  variant="outline"
                  className="font-medium"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Vault
                </Button>
              </div>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, username, or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input/30 max-w-md"
              />
            </div>

            {availableTags.length > 0 && (
              <div className="mb-6">
                <p className="text-slate-400 text-sm mb-2">Filter by Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className={`cursor-pointer ${selectedTags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 glass-panel max-w-2xl mx-auto rounded-3xl"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.15)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Key className="w-10 h-10 text-primary relative z-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery || selectedTags.length > 0 ? 'No matching entries' : 'Your vault is completely empty'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                {searchQuery || selectedTags.length > 0
                  ? 'Try adjusting your search or filters.'
                  : 'Start securing your credentials. All data is encrypted locally before being stored in the database.'}
              </p>
              {!(searchQuery || selectedTags.length > 0) && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="font-medium glass-button rounded-full mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Entry
                </Button>
              )}
            </motion.div>
          ) : !masterKey ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">Vault is locked.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredEntries.map((entry) => (
                  <VaultEntryCard
                    key={entry.id}
                    entry={entry}
                    decryptedPassword={decryptPassword(entry.encrypted_password)}
                    onEdit={() => {
                      setEditingEntry(entry);
                      setShowForm(true);
                    }}
                    onDelete={() => handleDeleteEntry(entry.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <VaultEntryForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingEntry(null);
          }}
          onSubmit={editingEntry ? handleUpdateEntry : handleCreateEntry}
          initialData={
            editingEntry
              ? {
                  title: editingEntry.title,
                  username: editingEntry.username,
                  password: decryptPassword(editingEntry.encrypted_password),
                  url: editingEntry.url,
                  notes: editingEntry.notes,
                  tags: editingEntry.tags,
                }
              : undefined
          }
          mode={editingEntry ? 'edit' : 'create'}
        />

        <Dialog open={showTwoFactorSettings} onOpenChange={setShowTwoFactorSettings}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <TwoFactorAuthSettings />
          </DialogContent>
        </Dialog>

        <Dialog open={showMasterKeyDialog} onOpenChange={() => {}}>
          <DialogContent
            className="glass-panel border-white/10 sm:max-w-[425px] text-foreground shadow-2xl"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  <Key className="w-5 h-5" />
                </div>
                Unlock Vault
              </DialogTitle>
              <DialogDescription className="text-muted-foreground pt-2">
                Enter your Master Key to encrypt and decrypt your vault. 
                <span className="block mt-2 font-medium text-amber-500/90">
                  We never store this key. If you lose it, your data cannot be recovered.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="masterKey">
                  Master Key
                </Label>
                <Input
                  id="masterKey"
                  type="password"
                  placeholder="Enter your strong master key"
                  value={tempMasterKey}
                  onChange={(e) => setTempMasterKey(e.target.value)}
                  className="bg-input/20 border-white/10 focus:border-primary/50 focus:ring-primary/50 transition-all"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleSetMasterKey}
                className="w-full font-medium glass-button"
              >
                Unlock Vault
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="glass-panel border-white/10 text-foreground shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Vault
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Upload your encrypted vault file (.json) to import entries.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                id="importFile"
                type="file"
                accept=".json"
                onChange={handleImportVault}
                className="bg-input/20 border-white/10 text-foreground file:text-white file:bg-primary file:border-none file:mr-4 file:px-4 file:py-1 hover:file:bg-primary/80 file:rounded-full file:transition-all"
              />
              <p className="text-sm text-slate-400">
                Note: Existing entries with the same ID might be overwritten or duplicated.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
