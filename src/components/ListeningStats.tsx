"use client";

type Rating = {
  rating: number;
  listened_at: string | null;
  created_at: string;
  artist_name: string;
};

export default function ListeningStats({ ratings }: { ratings: Rating[] }) {
  if (ratings.length === 0) return null;

  const getDate = (r: Rating) => new Date(r.listened_at ? r.listened_at + "T00:00:00" : r.created_at);

  // Albums per month (last 12 months)
  const now = new Date();
  const monthCounts: { label: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    const count = ratings.filter(r => {
      const rd = getDate(r);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    }).length;
    monthCounts.push({ label, count });
  }
  const maxMonth = Math.max(...monthCounts.map(m => m.count), 1);

  // Favorite decade
  const decadeCounts: Record<string, number> = {};
  ratings.forEach(r => {
    const year = getDate(r).getFullYear();
    const decade = `${Math.floor(year / 10) * 10}s`;
    decadeCounts[decade] = (decadeCounts[decade] ?? 0) + 1;
  });
  const favDecade = Object.entries(decadeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  // This year
  const thisYear = now.getFullYear();
  const thisYearCount = ratings.filter(r => getDate(r).getFullYear() === thisYear).length;

  // Avg rating trend (last 3 months vs before)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const recentRatings = ratings.filter(r => getDate(r) >= threeMonthsAgo);
  const recentAvg = recentRatings.length > 0
    ? (recentRatings.reduce((s, r) => s + r.rating, 0) / recentRatings.length).toFixed(1)
    : null;

  return (
    <div className="bg-stone-900 rounded-3xl p-5 border border-stone-800/60 space-y-5">
      <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold">Listening stats</h2>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-stone-800/60 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-stone-100">{thisYearCount}</p>
          <p className="text-[10px] text-stone-600 mt-0.5">{thisYear}</p>
        </div>
        <div className="bg-stone-800/60 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-stone-100">{favDecade}</p>
          <p className="text-[10px] text-stone-600 mt-0.5">Fav decade</p>
        </div>
        <div className="bg-stone-800/60 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-[var(--accent)]">{recentAvg ?? "-"}</p>
          <p className="text-[10px] text-stone-600 mt-0.5">Avg (3mo)</p>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div>
        <p className="text-[10px] text-stone-700 mb-2">Albums per month</p>
        <div className="flex items-end gap-1 h-16">
          {monthCounts.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full rounded-sm bg-[var(--accent)] opacity-70 transition-all"
                style={{ height: `${Math.max((m.count / maxMonth) * 52, m.count > 0 ? 4 : 0)}px` }}
                title={`${m.label}: ${m.count}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-[9px] text-stone-700">{monthCounts[0].label}</p>
          <p className="text-[9px] text-stone-700">{monthCounts[11].label}</p>
        </div>
      </div>
    </div>
  );
}
