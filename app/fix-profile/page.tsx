'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/ensure-profile';
import { useRouter } from 'next/navigation';

export default function FixProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState('Checking...');
  const [profileExists, setProfileExists] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAndFixProfile();
  }, []);

  const checkAndFixProfile = async () => {
    setStatus('Checking authentication...');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setStatus('❌ Not logged in. Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    setUser(user);
    setStatus('✅ Authenticated as ' + user.email);

    // Check if profile exists
    setStatus('Checking profile...');
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      setProfileExists(true);
      setStatus('✅ Profile exists! You can now add expenses.');
      setTimeout(() => router.push('/dashboard'), 2000);
      return;
    }

    // Profile doesn't exist, create it
    setStatus('⚠️ Profile missing. Creating profile...');
    
    const result = await ensureUserProfile(
      user.id, 
      user.email!, 
      user.user_metadata?.full_name
    );

    if (result.success) {
      setProfileExists(true);
      setStatus('✅ Profile created successfully! Redirecting to dashboard...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } else {
      setStatus('❌ Failed to create profile. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">
            {status.includes('✅') ? '✅' : status.includes('❌') ? '❌' : '⏳'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Setup</h1>
          <p className="text-gray-600 mb-6">{status}</p>

          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600">User ID:</p>
              <p className="text-xs font-mono text-gray-900 break-all">{user.id}</p>
              <p className="text-sm text-gray-600 mt-2">Email:</p>
              <p className="text-sm text-gray-900">{user.email}</p>
            </div>
          )}

          {profileExists && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="text-emerald-800 text-sm">
                Your profile is ready! You can now use all features.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={checkAndFixProfile}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
