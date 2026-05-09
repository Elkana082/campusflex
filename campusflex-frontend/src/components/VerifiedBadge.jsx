export default function VerifiedBadge({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle" }}
    >
      <circle cx="12" cy="12" r="11" fill="#1d9bf0" />
      <polyline
        points="7 12.5 10.5 16 17 9"
        stroke="#fff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}