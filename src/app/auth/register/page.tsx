'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore(); 
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password) { toast.error('Please fill all required fields!'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters!'); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', form);
      login(res.data);
      toast.success(`Welcome, ${res.data.firstName}! Account created successfully!`);
      router.push(res.data.role === 'ADMIN' ? '/admin' : '/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }; 
      toast.error(error?.response?.data?.message || 'Please try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ShoppingBag size={24} className="text-white" />
            </div>
            <span className="text-3xl font-black text-gray-900">Shop<span className="text-brand-600">Now</span></span>
          </Link>
          <p className="text-gray-500 mt-2">Pakistan&apos;s #1 Online Store</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-500 text-sm mb-6">Free registration — join now</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-firstName" className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                <input id="reg-firstName" name="firstName" autoComplete="given-name" value={form.firstName} onChange={handleChange} placeholder="Abdullah" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-sm" required />
              </div>
              <div>
                <label htmlFor="reg-lastName" className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                <input id="reg-lastName" name="lastName" autoComplete="family-name" value={form.lastName} onChange={handleChange} placeholder="Naseem" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input id="reg-email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-sm" required />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input id="reg-password" name="password" type={showPass ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-sm pr-12" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-brand-600 font-semibold hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
