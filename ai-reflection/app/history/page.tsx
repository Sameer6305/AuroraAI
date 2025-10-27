export default function HistoryPage() {
  const mockHistory = [
    {
      id: 1,
      date: "2025-10-27",
      mood: "Excellent",
      summary: "Great day with productive work sessions"
    },
    {
      id: 2,
      date: "2025-10-26",
      mood: "Good",
      summary: "Completed important tasks, feeling accomplished"
    },
    {
      id: 3,
      date: "2025-10-25",
      mood: "Neutral",
      summary: "Average day, some challenges but managed well"
    }
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Reflection History</h1>
        
        <div className="mb-6 flex gap-4">
          <input
            type="search"
            placeholder="Search reflections..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Moods</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="neutral">Neutral</option>
            <option value="low">Low</option>
            <option value="difficult">Difficult</option>
          </select>
        </div>

        <div className="space-y-4">
          {mockHistory.map((entry) => (
            <div
              key={entry.id}
              className="p-6 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{entry.date}</h3>
                <span className="px-3 py-1 rounded-full bg-blue-600 text-sm">
                  {entry.mood}
                </span>
              </div>
              <p className="text-gray-400">{entry.summary}</p>
              <div className="mt-4 flex gap-3">
                <button className="text-sm text-blue-400 hover:text-blue-300">
                  View Details
                </button>
                <button className="text-sm text-gray-400 hover:text-gray-300">
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>

        {mockHistory.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No reflections yet</p>
            <button className="py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">
              Create Your First Reflection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
