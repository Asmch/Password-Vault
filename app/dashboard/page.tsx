'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VaultEntryCard from '@/components/VaultEntryCard';
import VaultEntryForm, { VaultEntryData } from '@/components/VaultEntryForm';
import { toast } from 'sonner';
import { Plus, Search, LogOut, Shield, Key } from 'lucide-react';
import { encryptText, decryptText, generateEncryptionKey } from '@/lib/crypto';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface VaultEntry {
  id: string;
  title: string;
  username: string;
  encrypted_password: string;
  url: string;
  notes: string;
  created_at: string;
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
  const [tempMasterKey, setTempMasterKey] = useState('');

  useEffect(() => {
    const storedMasterKey = localStorage.getItem('masterKey');
    if (storedMasterKey) {
      setMasterKey(storedMasterKey);
      fetchEntries();
    } else {
      setShowMasterKeyDialog(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEntries(entries);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEntries(
        entries.filter(
          (entry) =>
            entry.title.toLowerCase().includes(query) ||
            entry.username.toLowerCase().includes(query) ||
            entry.url.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, entries]);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/vault', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch entries');

      const data = await response.json();
      setEntries(data.entries);
      setFilteredEntries(data.entries);
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">SecureVault</h1>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                className="text-slate-400 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Vault</h2>
                <p className="text-slate-400">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'} stored securely
                </p>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by title, username, or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Key className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'No entries found' : 'Your vault is empty'}
              </h3>
              <p className="text-slate-400 mb-6">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start by adding your first password entry'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Entry
                </Button>
              )}
            </motion.div>
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
                }
              : undefined
          }
          mode={editingEntry ? 'edit' : 'create'}
        />

        <Dialog open={showMasterKeyDialog} onOpenChange={() => {}}>
          <DialogContent
            className="bg-slate-800 border-slate-700"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5" />
                Set Master Encryption Key
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                This key will be used to encrypt all your passwords. Keep it safe and never share it.
                You'll need it to access your vault.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="masterKey" className="text-slate-200">
                  Master Key
                </Label>
                <Input
                  id="masterKey"
                  type="password"
                  placeholder="Enter a strong master key (min 8 characters)"
                  value={tempMasterKey}
                  onChange={(e) => setTempMasterKey(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <Button
                onClick={handleSetMasterKey}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Set Master Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
