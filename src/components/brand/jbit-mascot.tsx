import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  glow?: boolean;
}

export function BreviIcon({ size = "md", className = "", glow = false }: LogoProps) {
  const sizeMap = {
    sm: "w-8 h-8 rounded-lg p-1.5",
    md: "w-10 h-10 rounded-xl p-2",
    lg: "w-16 h-16 rounded-2xl p-3",
    xl: "w-20 h-20 rounded-3xl p-4",
  };

  const svgSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
  };

  return (
    <div
      id="app-brand-logo-icon"
      className={`inline-flex items-center justify-center bg-[#2A1810] border border-[#523324] shadow-sm select-none transition-transform duration-200 ${
        sizeMap[size]
      } ${glow ? "ring-2 ring-[#D97724]/40 shadow-lg shadow-[#B85414]/15" : ""} ${className}`}
      title="BreviAI Summarizer"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${svgSizes[size]} text-[#E59756]`}
      >
        {/* Document sheet base with folded corner */}
        <path
          d="M6 3.5C4.89543 3.5 4 4.39543 4 5.5V18.5C4 19.6046 4.89543 20.5 6 20.5H18C19.1046 20.5 20 19.6046 20 18.5V9.5L14 3.5H6Z"
          fill="#3C2317"
          stroke="#E59756"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Document fold crease */}
        <path
          d="M14 3.5V9.5H20"
          stroke="#E59756"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Summarized key takeaway lines with bullet points */}
        <path
          d="M8 12.5H13M8 15.5H16M8 18.5H11"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Left bullet dots */}
        <circle cx="6.5" cy="12.5" r="0.75" fill="#E59756" />
        <circle cx="6.5" cy="15.5" r="0.75" fill="#E59756" />
        {/* AI Synthesis Sparkle on top left */}
        <path
          d="M16.5 13.5L17.2 15L18.7 15.7L17.2 16.4L16.5 17.9L15.8 16.4L14.3 15.7L15.8 15L16.5 13.5Z"
          fill="#B85414"
          stroke="#E59756"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}

// Aliases for compatibility
export const RecapIcon = BreviIcon;
export const JBitMascot = BreviIcon;

export function JBitLogo({
  showSubtitle = false,
  className = "",
}: {
  showSubtitle?: boolean;
  className?: string;
}) {
  return (
    <div id="site-brand-logo" className={`flex items-center gap-2.5 ${className}`}>
      <BreviIcon size="sm" />
      <div className="flex items-center gap-1.5">
        <span className="text-lg font-bold tracking-tight text-[#22150E]">
          Brevi<span className="text-[#B85414]">AI</span>
        </span>
        {showSubtitle && (
          <span className="rounded-md bg-[#F4E8DB] px-1.5 py-0.5 text-[11px] font-mono font-medium text-[#8A4315] border border-[#E5D2BE]">
            Summarizer
          </span>
        )}
      </div>
    </div>
  );
}

