"use client";

import { motion } from "framer-motion";

// Wraps every route so navigation gets a subtle, fast fade + rise. `template.tsx`
// re-mounts on each navigation (unlike layout.tsx), which is exactly what a page
// transition needs. Kept short (0.28s) so it feels responsive, not sluggish.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
