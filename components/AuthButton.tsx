'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import React from 'react';
import Link from 'next/link';

const AuthButton = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <Link 
          href="/account" 
          className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          My Account
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: '/' })} 
          className="btn-secondary text-sm"
        >
          Sign Out
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
       <button 
        onClick={() => signIn()} 
        className="hidden md:block px-4 py-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
      >
        Sign In
      </button>
      <button 
        onClick={() => signIn()} // Or redirect to a dedicated pricing/signup page
        className="btn-premium text-sm"
      >
        Start Free Trial
      </button>
    </div>
  );
};

export default AuthButton;
