// src/components/LogoStay.jsx
import React from "react";

export default function LogoStay({ className = "mb-2" }) {
  // Use a refined font stack and spacing for closer visual match
  const textStyle = {
    fontFamily:
      // A strong, classic Didone font is key.
      "'Bodoni Moda', 'Playfair Display', 'Times New Roman', serif",
    fontWeight: 400,
    // The spacing in this new image is tighter than the previous one.
    letterSpacing: "0.12em",
    margin: 0,
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ lineHeight: 1 }}
    >
      {/* Main text: single-line, responsive */}
      <h1
        className="whitespace-nowrap text-[clamp(28px,6.5vw,96px)]"
        style={textStyle}
        aria-hidden // decorative large text
      >
        STAY SUITE 7
      </h1>

      <svg
        className="pointer-events-none absolute left-0 top-0 w-full h-full"
        // Adjust the viewBox for a good balance (1000 wide is for the whole line)
        viewBox="0 0 1000 150"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {/*
          New Path: Starts on 'T' stem, arcs over 'A', ends on 'Y' stem.
          M135 65: Start point (on T's vertical stem, slightly above center)
          C150 10 200 10 280 65: Curve control points for a low, sharp arc
          
          The x-coordinates (135 to 280) place the curve exactly over T, A, and Y.
          The y-coordinates (65 down to 10 and back to 65) control the height and shape.
        */}
        <path
          d="M135 65 C150 10 200 10 280 65"
          fill="none"
          stroke="#000"
          // Reduced strokeWidth to 4 for a thinner, cleaner line like the image
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="1"
        />
      </svg>
    </div>
  );
}
