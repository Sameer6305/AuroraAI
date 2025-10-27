export default function DailyFormPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Daily Reflection Form</h1>
        <form className="space-y-6">
          <div>
            <label htmlFor="mood" className="block text-sm font-medium mb-2">
              How are you feeling today?
            </label>
            <select
              id="mood"
              className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select your mood</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="neutral">Neutral</option>
              <option value="low">Low</option>
              <option value="difficult">Difficult</option>
            </select>
          </div>

          <div>
            <label htmlFor="gratitude" className="block text-sm font-medium mb-2">
              What are you grateful for today?
            </label>
            <textarea
              id="gratitude"
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your thoughts..."
            />
          </div>

          <div>
            <label htmlFor="challenges" className="block text-sm font-medium mb-2">
              What challenges did you face?
            </label>
            <textarea
              id="challenges"
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe any challenges..."
            />
          </div>

          <div>
            <label htmlFor="goals" className="block text-sm font-medium mb-2">
              What are your goals for tomorrow?
            </label>
            <textarea
              id="goals"
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List your goals..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold"
          >
            Submit Reflection
          </button>
        </form>
      </div>
    </div>
  );
}
