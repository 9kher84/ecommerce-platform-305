export interface User {
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'seller' | 'buyer';
    isPhoneVerified: boolean;
    biometricEnabled: boolean;
}

export interface AuthSession {
    token: string;
    refreshToken: string;
    user: User;
    expiresAt: number;
}
