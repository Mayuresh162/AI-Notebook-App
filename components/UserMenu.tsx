'use client'

import { useState } from 'react'
import { User } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const supabase = getSupabaseClient();

  const handleNewChat = () => {
    localStorage.removeItem("chat_messages");
    window.location.reload();
  }


  async function logout() {
    await supabase.auth.signOut();
    location.href = "/login";
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-9 w-9 rounded-full bg-[#171717] border border-white/10 flex items-center justify-center"
      >
        <User size={16} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[#111111] shadow-2xl p-2 z-50">

          <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5" onClick={handleNewChat}>
            New Chat
          </button>

          <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5">
            Profile
          </button>

          <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5">
            Settings
          </button>

          <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5">
            Theme
          </button>

          <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5" onClick={logout}>
            Logout
          </button>

        </div>
      )}
    </div>
  )
}