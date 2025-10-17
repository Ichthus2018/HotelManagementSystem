import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/HotelManagementSystem/",
  build: {
    outDir: "dist",
  },
  // 👇 Add hook to duplicate index.html -> 404.html
  buildEnd() {
    const indexPath = path.resolve(__dirname, "dist/index.html");
    const notFoundPath = path.resolve(__dirname, "dist/404.html");
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, notFoundPath);
      console.log("✅ 404.html created for SPA routing (GitHub Pages fix)");
    } else {
      console.warn("⚠️ index.html not found. Run `vite build` first.");
    }
  },
});
