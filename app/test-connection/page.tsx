'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestConnection() {
  const [status, setStatus] = useState<any>({
    connection: 'Testing...',
    categories: 'Testing...',
    auth: 'Testing...',
  });

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    // Test 1: Basic connection
    try {
      const { data, error } = await supabase.from('categories').select('count');
      if (error) {
        setStatus((prev: any) => ({ ...prev, connection: `❌ Error: ${error.message}` }));
      } else {
        setStatus((prev: any) => ({ ...prev, connection: '✅ Connected' }));
      }
    } catch (err: any) {
      setStatus((prev: any) => ({ ...prev, connection: `❌ Error: ${err.message}` }));
    }

    // Test 2: Categories exist
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) {
        setStatus((prev: any) => ({ ...prev, categories: `❌ Error: ${error.message}` }));
      } else if (data && data.length > 0) {
        setStatus((prev: any) => ({ ...prev, categories: `✅ Found ${data.length} categories` }));
      } else {
        setStatus((prev: any) => ({ ...prev, categories: '⚠️ No categories found - run SQL schema' }));
      }
    } catch (err: any) {
      setStatus((prev: any) => ({ ...prev, categories: `❌ Error: ${err.message}` }));
    }

    // Test 3: Auth status
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus((prev: any) => ({ ...prev, auth: `✅ Logged in as ${session.user.email}` }));
      } else {
        setStatus((prev: any) => ({ ...prev, auth: '⚠️ Not logged in' }));
      }
    } catch (err: any) {
      setStatus((prev: any) => ({ ...prev, auth: `❌ Error: ${err.message}` }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Supabase Connection Test</h1>
        
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div className="border-b pb-4">
            <h2 className="font-semibold text-gray-900 mb-2">Database Connection</h2>
            <p className="text-gray-600">{status.connection}</p>
          </div>

          <div className="border-b pb-4">
            <h2 className="font-semibold text-gray-900 mb-2">Categories Table</h2>
            <p className="text-gray-600">{status.categories}</p>
          </div>

          <div className="pb-4">
            <h2 className="font-semibold text-gray-900 mb-2">Authentication</h2>
            <p className="text-gray-600">{status.auth}</p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>If categories show "No categories found", run the SQL schema in Supabase</li>
            <li>Go to Supabase Dashboard → Authentication → Providers → Email</li>
            <li>Disable "Enable email confirmations" for development</li>
            <li>Try signing up at <a href="/signup" className="underline">/signup</a></li>
          </ol>
        </div>

        <div className="mt-4 flex gap-4">
          <a
            href="/signup"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Signup
          </a>
          <a
            href="/login"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Go to Login
          </a>
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Retest
          </button>
        </div>
      </div>
    </div>
  );
}
