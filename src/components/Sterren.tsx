export default function Sterren({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const vol = rating >= star;
        const half = !vol && rating >= star - 0.5;
        return (
          <span key={star} className="relative inline-block text-xs leading-none">
            {/* Empty star background */}
            <span className="text-stone-700">★</span>
            {/* Filled overlay */}
            {(vol || half) && (
              <span
                className="absolute inset-0 overflow-hidden text-[var(--accent)]"
                style={{ width: vol ? "100%" : "50%" }}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
      <span className="text-stone-600 text-xs ml-1">{rating}</span>
    </div>
  );
}
