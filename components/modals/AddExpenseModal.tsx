'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ensureUserProfile } from '@/lib/ensure-profile';
import { supabase } from '@/lib/supabase';
import { FileImage, Loader2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface AddExpenseModalProps {
  user: any;
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
  expense?: any;
}

export default function AddExpenseModal({
  user,
  categories,
  onClose,
  onSuccess,
  expense,
}: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setCategoryId(expense.category_id || '');
      setDescription(expense.description || '');
      setDate(expense.date);
      setReceiptUrl(expense.receipt_url || '');
    }
  }, [expense]);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, and PDF are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB');
      return;
    }

    setReceipt(file);
    setUploadingReceipt(true);

    try {
      // Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to upload receipts');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload receipt');
      }

      const data = await response.json();
      setReceiptUrl(data.url);

      // Auto-fill OCR data if available
      if (data.ocr) {
        console.log('OCR Data received:', data.ocr);
        if (data.ocr.amount) setAmount(data.ocr.amount.toString());
        if (data.ocr.date) setDate(data.ocr.date);
        if (data.ocr.merchant && !description) setDescription(data.ocr.merchant);
        if (data.ocr.category_id) {
          console.log('Setting category ID:', data.ocr.category_id);
          setCategoryId(data.ocr.category_id);
        } else {
          console.log('No category_id in OCR data');
        }

        toast.success('Receipt uploaded and data extracted!');
      } else {
        toast.success('Receipt uploaded successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload receipt');
      setReceipt(null);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to continue');
        setLoading(false);
        return;
      }

      const token = session.access_token;

      if (expense) {
        // Update existing expense
        const response = await fetch('/api/expenses', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: expense.id,
            amount: parseFloat(amount),
            category_id: categoryId || null,
            description: description || null,
            date,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update expense');
        }

        toast.success('Expense updated successfully');
      } else {
        // Create new expense
        await ensureUserProfile(user.id, user.email, user.user_metadata?.full_name);

        const { error: insertError } = await supabase.from('expenses').insert([
          {
            user_id: user.id,
            amount: parseFloat(amount),
            category_id: categoryId || null,
            description,
            date,
            receipt_url: receiptUrl || null,
          },
        ]);

        if (insertError) {
          throw new Error(insertError.message);
        }

        toast.success('Expense added successfully');
      }

      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Receipt Upload */}
          <div>
            <Label>Receipt (Optional)</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                className="hidden"
              />

              {uploadingReceipt ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Uploading and extracting data...</p>
                </div>
              ) : receipt ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileImage className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{receipt.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, PDF • Max 5MB</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center space-x-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingReceipt}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
