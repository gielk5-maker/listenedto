export default function Logo({ size = 28 }: { size?: number }) {
  const star = "M16.89,11.55 Q17.00,11.20 17.11,11.55 L17.63,13.13 L19.30,13.13 Q19.66,13.13 19.37,13.35 L18.02,14.33 L18.53,15.92 Q18.65,16.27 18.35,16.05 L17.00,15.07 L15.65,16.05 Q15.35,16.27 15.47,15.92 L15.98,14.33 L14.63,13.35 Q14.34,13.13 14.70,13.13 L16.37,13.13 Z";

  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-dark)" />
        </linearGradient>
      </defs>

      <rect width="28" height="28" rx="7" fill="url(#logo-grad)" />

      {/* Back circle (left) */}
      <circle cx="11" cy="14" r="7.5" fill="#2a0e00" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <circle cx="11" cy="14" r="3.2" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.9" />

      {/* Front circle (right) */}
      <circle cx="17" cy="14" r="7.5" fill="#3d1600" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
      <circle cx="17" cy="14" r="3.2" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.9" />

      {/* Star — same shape as rating stars */}
      <path d={star} fill="white" />
    </svg>
  );
}
