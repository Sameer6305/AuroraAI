export default function ResultPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Your Reflection Results</h1>
        
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-gray-800 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">AI Analysis</h2>
            <p className="text-gray-300 leading-relaxed">
              Based on your reflection, here are some insights and recommendations
              to help you grow and improve your daily well-being.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-gray-800 border border-gray-700">
            <h3 className="text-xl font-semibold mb-3">Mood Summary</h3>
            <div className="flex items-center gap-4">
              <div className="text-4xl">😊</div>
              <div>
                <p className="text-lg font-medium">Good</p>
                <p className="text-sm text-gray-400">You're maintaining positive energy</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-gray-800 border border-gray-700">
            <h3 className="text-xl font-semibold mb-3">Key Insights</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-gray-300">Strong gratitude practice observed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span className="text-gray-300">Consider breaking down larger challenges into smaller steps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">!</span>
                <span className="text-gray-300">Set specific, measurable goals for better tracking</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold">
              Save to History
            </button>
            <button className="flex-1 py-3 px-6 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors font-semibold">
              New Reflection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
