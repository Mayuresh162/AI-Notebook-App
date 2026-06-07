"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export default function SidebarDrawer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);

    window.addEventListener("close-sidebar", close);

    return () => window.removeEventListener("close-sidebar", close);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2"
        aria-label="Open Menu"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* dark backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* drawer */}
          <motion.aside
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-0 h-full w-[86%] max-w-[320px] bg-[#111111] shadow-2xl border-r border-white/10 overflow-y-auto"
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
              <span className="font-medium">AI Notebook</span>

              <button onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="h-[calc(100%-56px)]">{children}</div>
          </motion.aside>
        </div>
      )}
    </>
  );
}
