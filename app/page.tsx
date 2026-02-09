import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">Smart Expense Tracker</h1>
          <p className="text-xl text-gray-600 mb-12">
            AI-powered insights for smarter spending decisions
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition"
            >
              View Demo
            </Link>
          </div>

          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Smart Analytics</h3>
              <p className="text-gray-600">Real-time insights into your spending patterns</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
              <p className="text-gray-600">Get personalized financial advice</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-semibold mb-2">Export Reports</h3>
              <p className="text-gray-600">Download CSV and PDF reports</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
