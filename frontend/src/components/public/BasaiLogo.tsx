"use client";

interface BasaiLogoProps {
  className?: string;
  size?: number;
}

export default function BasaiLogo({ className = "h-8 w-auto text-[#E4AA8B]" }: BasaiLogoProps) {
  return (
    <svg
      viewBox="0 0 42 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Basai brand logo"
    >
      {/* Architectural vertical pillar / foundation */}
      <rect x="4" y="4" width="3.5" height="28" rx="1.75" fill="currentColor" />

      {/* Upper architectural arch (shelter / hospitality curve) */}
      <path
        d="M7.5 6.5H23C27.6944 6.5 31.5 10.3056 31.5 15C31.5 19.6944 27.6944 23.5 23 23.5H7.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lower grounded arch (abode / sanctuary foundation) */}
      <path
        d="M7.5 21H24.5C29.4706 21 33.5 25.0294 33.5 30C33.5 30.8 32.8 31.5 32 31.5H7.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pavilion apex accent: subtle Himalayan architectural pinnacle */}
      <path
        d="M17 11L21 6.5L25 11"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
