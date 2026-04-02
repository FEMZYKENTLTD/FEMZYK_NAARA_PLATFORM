// app/(auth)/register/page.tsx
// ============================================================================
// Registration Page — New users create their NÀÁRA account here
// ============================================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

/** Available roles a user can pick during registration */
const ROLES = [
  { value: 'user', label: 'User', desc: 'General platform user' },
  { value: 'apprentice', label: 'Apprentice', desc: 'I am learning a trade or skill' },
  { value: 'master', label: 'Master Artisan', desc: 'I teach and verify skills' },
  { value: 'freelancer', label: 'Freelancer', desc: 'I do gig work and freelancing' },
  { value: 'employer', label: 'Employer', desc: 'I hire skilled workers' },
] as const;

export default function RegisterPage() {
  const supabase = createClient();

  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handles the registration form submission.
   * 1. Creates auth user in Supabase Auth
   * 2. Creates profile row in our users table
   */
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!fullName || !username || !email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    try {
      const normalizedRole = role === 'user' ? 'apprentice' : role;

      // Step 1: Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
            role: normalizedRole,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      // Step 2: Create the user profile in our users table
      const profilePayload = {
        auth_id: authData.user.id,
        full_name: fullName.trim(),
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        role: normalizedRole,
        trust_score: 0,
        language: 'en',
        is_verified: false,
        consent_flags: {},
      };

      // Retry once for transient failures to avoid silent signup/profile mismatch.
      let { error: profileError } = await supabase.from('users').insert(profilePayload);
      if (profileError) {
        console.error('Profile creation error (attempt 1):', profileError);
        const retry = await supabase.from('users').insert(profilePayload);
        profileError = retry.error;
      }
      if (profileError) {
        setError(`Account created, but profile setup failed: ${profileError.message}`);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Success screen after registration
  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Created!</h1>
          <p className="text-slate-600 mb-6">
            Check your email for a confirmation link. Once confirmed, you can sign in.
          </p>
          <Link href="/login">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              Go to Sign In
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-md p-6 sm:p-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to home
        </Link>

        {/* Header */}
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Create your <span className="text-orange-500">NÀÁRA</span> account
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Join Africa&apos;s trusted skills and opportunity ecosystem
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Registration form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="e.g. Chidi Okafor"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="e.g. chidi_mechanic"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, '_'))}
              required
              className="mt-1"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1"
            />
          </div>

          {/* Role Selection */}
          <div>
            <Label>I am a...</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    role === r.value
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-sm text-slate-900">
                    {r.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Link to login */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-purple-600 hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}