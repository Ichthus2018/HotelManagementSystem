import React from "react";
import { ScaleLoader } from "react-spinners";

// You can customize the colors and text to match your app's branding.
const LOADER_COLOR = "#0000FF";
const LOADING_TEXT = "Loading";

const Loader = () => {
  return (
    // Use fixed positioning to cover the entire screen
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/10 backdrop-blur-sm">
      <ScaleLoader
        color={LOADER_COLOR}
        height={50}
        width={6}
        radius={2}
        margin={3}
      />
      <p className="mt-6 text-xl font-medium text-slate-600 animate-pulse">
        {LOADING_TEXT}
      </p>
    </div>
  );
};

export default Loader;
