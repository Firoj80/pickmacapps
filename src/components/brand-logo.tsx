import type { SVGProps } from "react";

export function PickMacAppsIcon({ className = "h-5 w-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="pma-icon-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1c1d22" />
          <stop offset="100%" stopColor="#090a0d" />
        </linearGradient>
      </defs>
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="8.5"
        fill="url(#pma-icon-bg)"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.2"
      />
      <path
        d="M 9.5 12.5 Q 12.5 8 15 12.5"
        stroke="#FFFFFF"
        strokeWidth="1.85"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 17 12.5 Q 19.5 8 22.5 12.5"
        stroke="#FFFFFF"
        strokeWidth="1.85"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 9.5 17 Q 16 24 22.5 17"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
