export default function VerifiedBadge({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-label="Verified">
      <circle cx="12" cy="12" r="12" fill="var(--accent)" />
      <path d="M7 12.5l3.5 3.5 6.5-7" stroke="var(--accent-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
