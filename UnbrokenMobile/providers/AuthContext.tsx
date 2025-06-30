import React, { createContext, useState, useContext } from 'react';

export type AuthUser = {
  username: string;
  role: 'driver' | 'dock_worker' | 'warehouse_staff' | '';
};

export type AuthContextType = {
  user: AuthUser;
  setUser: (user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: { username: '', role: '' },
  setUser: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>({ username: '', role: '' });

  const logout = () => setUser({ username: '', role: '' });

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 