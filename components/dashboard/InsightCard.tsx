'use client';

export default function InsightCard() {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">💡 Smart Insight</h3>
          <p className="text-indigo-100">
            You spent 18% more on weekends this month. Consider planning meals ahead to reduce
            dining out costs.
          </p>
        </div>
        <button className="text-white/80 hover:text-white text-sm">Ask AI</button>
      </div>
    </div>
  );
}
