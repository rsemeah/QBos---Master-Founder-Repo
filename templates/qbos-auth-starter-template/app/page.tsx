/**
 * Landing Page
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Your App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Built with QuietBuild OS - AI-powered app generation
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold mb-2">Secure Authentication</h3>
              <p className="text-gray-600">
                Built-in user authentication with Supabase
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Fast & Modern</h3>
              <p className="text-gray-600">
                Next.js 14 with App Router and TypeScript
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-semibold mb-2">Ready to Deploy</h3>
              <p className="text-gray-600">
                Deploy to Vercel with one click
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-8 text-gray-500">
        <p>Built by <a href="https://quietbuild.com" className="text-blue-600 hover:underline">QuietBuild OS</a></p>
      </footer>
    </div>
  );
}
