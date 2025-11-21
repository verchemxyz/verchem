import 'next-auth';

declare module 'next-auth' {
  /**
   * Extends the built-in session.user object to include a 'role'.
   */
  interface Session {
    user?: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: 'user' | 'premium' | 'admin' | null;
    };
  }

  /**
   * Extends the built-in user object.
   */
  interface User {
    role?: 'user' | 'premium' | 'admin' | null;
  }
}

declare module 'next-auth/jwt' {
    /** Extends the built-in JWT token. */
    interface JWT {
      role?: 'user' | 'premium' | 'admin' | null;
    }
}
