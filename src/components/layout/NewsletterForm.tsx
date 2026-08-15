'use client';
import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/newsletter/subscribe', { email: email.trim() });
      toast.success(res.data?.message || 'Subscribed!');
      setEmail('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Could not subscribe, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3">
        <Mail size={16} className="text-white/50 flex-shrink-0" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Email address for newsletter"
          className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder:text-white/40 outline-none min-w-0"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-brand hover:bg-brand-700 text-white font-bold text-sm px-5 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0"
      >
        {submitting ? '…' : (<><Send size={15} /> Subscribe</>)}
      </button>
    </form>
  );
}
