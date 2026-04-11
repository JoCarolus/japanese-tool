'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  email: string
  onSignOut: () => void
}

export default function UserMenu({ email, onSignOut }: Props) {
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    onSignOut()
    setOpen(false)
  }

  // Show just the first part of the email
  const displayEmail = email.split('@')[0]

  return (
    <div className="user-menu">
      <button
        className="user-menu-btn"
        onClick={() => setOpen(!open)}
        title={email}
      >
        <span className="user-menu-avatar">
          {displayEmail[0].toUpperCase()}
        </span>
        <span className="user-menu-name">{displayEmail}</span>
        <span className="user-menu-caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-email">{email}</div>
          <button className="user-menu-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

