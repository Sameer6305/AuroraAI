import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Reflection
          </Link>
          <div className="flex gap-6">
            <Link 
              href="/daily-form" 
              className="text-gray-300 hover:text-white transition-colors"
            >
              Daily Form
            </Link>
            <Link 
              href="/result" 
              className="text-gray-300 hover:text-white transition-colors"
            >
              Results
            </Link>
            <Link 
              href="/history" 
              className="text-gray-300 hover:text-white transition-colors"
            >
              History
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
