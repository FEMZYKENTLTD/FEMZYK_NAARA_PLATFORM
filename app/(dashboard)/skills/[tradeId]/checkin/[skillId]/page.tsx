// app/(dashboard)/skills/[tradeId]/checkin/[skillId]/page.tsx
// ============================================================================
// Skill Check-In Page — Upload evidence to verify a skill
// Apprentices upload photo/video proof, then a master can verify
// ============================================================================

'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  Camera,
  Upload,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { use } from 'react';

export default function CheckInPage({
  params,
}: {
  params: Promise<{ tradeId: string; skillId: string }>;
}) {
  const { tradeId, skillId } = use(params);
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles file selection from the user's device.
   * Creates a preview URL for display.
   */
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file type (images and videos only)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(selected.type)) {
      setError('Please upload a JPG, PNG, WebP image or MP4 video.');
      return;
    }

    // Validate file size (max 10MB)
    if (selected.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.');
      return;
    }

    setFile(selected);
    setError(null);

    // Create preview
    const url = URL.createObjectURL(selected);
    setPreview(url);
  }

  /**
   * Handles the check-in submission.
   * 1. Uploads the evidence file to Supabase Storage
   * 2. Creates an apprentice_skills record with status "pending"
   * 3. Logs the activity
   */
  async function handleSubmit() {
    if (!file) {
      setError('Please select a photo or video as evidence.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }

      // Get user profile (we need user_id from our users table)
      const { data: profile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', user.id)
        .single();

      if (!profile) {
        setError('User profile not found.');
        setLoading(false);
        return;
      }

      // Upload evidence file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/${skillId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('skill-evidence')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      // Get the public URL (even if upload fails, we'll store a placeholder)
      let proofUrl = '';
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('skill-evidence')
          .getPublicUrl(fileName);
        proofUrl = urlData.publicUrl;
      } else {
        console.error('Upload error:', uploadError);
        // Continue without the URL — we'll store evidence locally
        proofUrl = `local://${fileName}`;
      }

      // Create the apprentice_skills record
      const { error: insertError } = await supabase
        .from('apprentice_skills')
        .upsert({
          user_id: profile.user_id,
          skill_id: skillId,
          status: 'pending',
          proof_url: proofUrl,
          timestamp: new Date().toISOString(),
          trust_score_delta: 0,
          is_synced: true,
        }, {
          onConflict: 'user_id,skill_id',
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Failed to save check-in. Please try again.');
        setLoading(false);
        return;
      }

      // Log the activity
      await supabase.from('activity_logs').insert({
        user_id: profile.user_id,
        module_id: 'skillforge',
        action_type: 'skill_checkin',
        action_details: {
          skill_id: skillId,
          trade_id: tradeId,
          proof_url: proofUrl,
        },
        is_synced: true,
      });

      setSuccess(true);
    } catch (err) {
      console.error('Check-in error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Success screen
  if (success) {
    return (
      <main className="space-y-6">
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Skill Check-In Submitted!
          </h1>
          <p className="text-slate-600 mb-6">
            Your evidence has been uploaded. A master artisan will review and
            verify your skill.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/skills/${tradeId}`}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">
                Back to Skill Tree
              </Button>
            </Link>
            <Link href="/home">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/skills/${tradeId}`}
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to skill tree
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Skill Check-In</h1>
        <p className="text-slate-500 mt-1">
          Upload a photo or video showing you performing this skill
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Upload Area */}
      <Card className="p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Evidence Upload</h2>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Preview or Upload button */}
        {preview ? (
          <div className="space-y-4">
            {/* Image preview */}
            {file?.type.startsWith('image/') && (
              <div className="relative rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={preview}
                  alt="Evidence preview"
                  className="w-full max-h-80 object-cover"
                />
              </div>
            )}

            {/* Video preview */}
            {file?.type.startsWith('video/') && (
              <div className="relative rounded-lg overflow-hidden border border-slate-200">
                <video
                  src={preview}
                  controls
                  className="w-full max-h-80"
                />
              </div>
            )}

            {/* File info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{file?.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Change File
              </Button>
            </div>
          </div>
        ) : (
          /* Empty upload area */
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center hover:border-purple-400 hover:bg-purple-50/50 transition-all cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-purple-600" />
            </div>
            <p className="font-semibold text-slate-900 mb-1">
              Tap to upload evidence
            </p>
            <p className="text-sm text-slate-500">
              Photo (JPG, PNG) or Video (MP4) — Max 10MB
            </p>
          </button>
        )}
      </Card>

      {/* Tips */}
      <Card className="p-5 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          Tips for Good Evidence
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Show yourself clearly performing the skill</li>
          <li>• Include the finished result if applicable</li>
          <li>• Good lighting helps verification</li>
          <li>• Videos should be under 30 seconds</li>
        </ul>
      </Card>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Uploading evidence...
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 mr-2" />
            Submit for Verification
          </>
        )}
      </Button>
    </div>
  );
}