import { AuthSession, User } from '../entities/User';

export interface AuthRepository {
    login(email: string, password: string): Promise<AuthSession>;
    logout(): Promise<void>;
    enableBiometrics(): Promise<boolean>;
    loginWithBiometrics(): Promise<AuthSession | null>;
    getSession(): Promise<AuthSession | null>;
}
