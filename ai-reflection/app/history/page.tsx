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
        <h1 className="text-4xl font-bold mb-2 accent-gradient">Reflection History</h1>
        <p className="text-gray-400 mb-8">Review your past reflections and track your progress</p>
        
        <div className="mb-6 flex gap-4">
          <input
            type="search"
            placeholder="Search reflections..."
            className="input-field flex-1"
          />
          <select className="input-field w-48">
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
              className="card hover:border-accent/50 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{entry.date}</h3>
                <span className="px-3 py-1 rounded-full bg-accent text-[#0e0e0e] text-sm font-semibold">
                  {entry.mood}
                </span>
              </div>
              <p className="text-gray-400">{entry.summary}</p>
              <div className="mt-4 flex gap-3">
                <button className="text-sm accent-text hover:underline">
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
          <div className="text-center py-12 card">
            <p className="text-gray-400 text-lg mb-4">No reflections yet</p>
            <button className="btn-primary">
              Create Your First Reflection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
