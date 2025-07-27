import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (username: string, email: string, password: string) => Promise<boolean>;
  connectWallet: () => Promise<boolean>;
}

// Mock data for development
const MOCK_USER: User = {
  id: "user-1",
  username: "dev_alice",
  displayName: "Alice Developer",
  avatarUrl: "https://api.dicebear.com/6.x/avataaars/svg?seed=Alice",
  bio: "Full-stack developer with passion for blockchain",
  walletAddress: "0.0.12345",
  tokens: 500,
  createdAt: new Date(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check local storage for persisted auth
    const storedUser = localStorage.getItem("devvault_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // In a real app, this would verify the token with the server
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      // In real app, we'd make an API call here
      console.log(`Logging in with ${username} and password`);
      
      // Mock successful login for development
      const user = MOCK_USER;
      setUser(user);
      localStorage.setItem("devvault_user", JSON.stringify(user));
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      // In real app, we'd make an API call here
      console.log(`Signing up with ${username}, ${email} and password`);
      
      // Mock successful signup for development
      const newUser = {
        ...MOCK_USER,
        username,
        displayName: username,
        tokens: 100, // Starting tokens
      };
      
      setUser(newUser);
      localStorage.setItem("devvault_user", JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      // In real app, we'd connect to Hedera wallet here
      console.log("Connecting wallet...");
      
      // Mock successful wallet connection
      if (user) {
        const updatedUser = {
          ...user,
          walletAddress: "0.0.12345", // Mock Hedera wallet address
        };
        setUser(updatedUser);
        localStorage.setItem("devvault_user", JSON.stringify(updatedUser));
      }
      return true;
    } catch (error) {
      console.error("Wallet connection error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("devvault_user");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user,
      login, 
      logout, 
      signup,
      connectWallet
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};