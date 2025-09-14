export interface User {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  dateJoined: Date;
  isActive: boolean;
  authProvider?: "email" | "google" | "apple";
  preferences?: {
    currency: string;
    notifications: boolean;
    darkMode: boolean;
  };
}

export interface UserRegistrationData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface SocialAuthData {
  provider: "google" | "apple";
  accessToken?: string;
  idToken?: string;
  user: {
    id: string;
    name?: string;
    email?: string;
    photo?: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType {
  authState: AuthState;
  login: (loginData: UserLoginData) => Promise<boolean>;
  register: (registrationData: UserRegistrationData) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
}
