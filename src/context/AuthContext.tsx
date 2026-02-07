import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'admin' | 'dispatcher' | 'driver';

interface User {
    id: string;
    name: string;
    role: UserRole;
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (role: UserRole) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check for existing session
        const storedUser = localStorage.getItem('greenpath_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (role: UserRole) => {
        // Simulate secure login and token generation
        const mockUser: User = {
            id: crypto.randomUUID(),
            name: role === 'admin' ? 'System Administrator' : role === 'dispatcher' ? 'Logistics Coordinator' : 'Field Driver',
            role,
            token: `eyJh...${crypto.randomUUID()}` // Mock JWT
        };

        localStorage.setItem('greenpath_user', JSON.stringify(mockUser));
        setUser(mockUser);
    };

    const logout = () => {
        localStorage.removeItem('greenpath_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
