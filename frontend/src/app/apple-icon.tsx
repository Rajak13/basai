import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1E1B19",
          border: "4px solid rgba(228, 170, 139, 0.4)",
        }}
      >
        <svg
          viewBox="0 0 42 36"
          width="120"
          height="102"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="4" y="4" width="3.5" height="28" rx="1.75" fill="#E4AA8B" />
          <path
            d="M7.5 6.5H23C27.6944 6.5 31.5 10.3056 31.5 15C31.5 19.6944 27.6944 23.5 23 23.5H7.5"
            stroke="#E4AA8B"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 21H24.5C29.4706 21 33.5 25.0294 33.5 30C33.5 30.8 32.8 31.5 32 31.5H7.5"
            stroke="#E4AA8B"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 11L21 6.5L25 11"
            stroke="#E4AA8B"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
