import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="border-b border-gray-800 bg-[#0e0e0e]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold accent-gradient">
            AI Reflection
          </Link>
          <div className="flex gap-6">
            <Link 
              href="/daily-form" 
              className="text-gray-300 hover:text-accent transition-colors"
            >
              Daily Form
            </Link>
            <Link 
              href="/result" 
              className="text-gray-300 hover:text-accent transition-colors"
            >
              Results
            </Link>
            <Link 
              href="/history" 
              className="text-gray-300 hover:text-accent transition-colors"
            >
              History
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
