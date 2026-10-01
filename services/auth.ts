import { api, ENDPOINTS } from './api';
import { auth } from './firebase';
import { authStorage, storage } from './storage';
import { AuthTokens, User } from '@/types';
import { signInWithCustomToken } from 'firebase/auth';

interface AuthResponse {
	tokens: AuthTokens;
	user: User;
}

export const normalizeEmail = (email: string): string => {
	return email.trim().toLowerCase();
};

const responseData = <T>(response: { data: T | { data: T } }): T => {
	const data = response.data;
	return typeof data === 'object' && data !== null && 'data' in data
		? data.data
		: data as T;
};

const saveTokens = async (tokens: AuthTokens): Promise<void> => {
	await Promise.all([
		authStorage.setToken(tokens.accessToken),
		authStorage.setRefreshToken(tokens.refreshToken),
	]);
};

const getStoredTokens = async (): Promise<AuthTokens | null> => {
	const [accessToken, refreshToken] = await Promise.all([
		authStorage.getToken(),
		authStorage.getRefreshToken(),
	]);
	if (!accessToken || !refreshToken) return null;
	return { accessToken, refreshToken, expiresIn: 0, tokenType: 'Bearer' };
};

const clearTokens = async (): Promise<void> => {
	await authStorage.clearAuth();
	await auth?.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
	const response = await api.get('/auth/me');
	return responseData<{ user: User }>(response).user;
};

export const authService = {
	getStoredTokens,
	clearTokens,
	requestOtp: async (email: string): Promise<void> => {
		await api.post(ENDPOINTS.auth.otpSend, { email: normalizeEmail(email) });
	},

	validateToken: async (token: string): Promise<boolean> => {
		if (!auth?.currentUser || !token) return false;
		try {
			await auth.currentUser.getIdToken();
			return true;
		} catch {
			return false;
		}
	},

	login: async (email: string, otp: string): Promise<AuthResponse> => {
		const normalizedEmail = normalizeEmail(email);
		const response = await api.post(ENDPOINTS.auth.otpVerify, { email: normalizedEmail, otp });
		const result = responseData<{ customToken: string; user?: User }>(response);
		if (!auth) throw new Error('Firebase authentication is not configured');
		const credential = await signInWithCustomToken(auth, result.customToken);
		const tokens: AuthTokens = {
			accessToken: await credential.user.getIdToken(),
			refreshToken: result.customToken,
			expiresIn: 3600,
			tokenType: 'Bearer',
		};
		await saveTokens(tokens);
		const user = result.user || await authService.getCurrentUser();
		if (!user) throw new Error('User profile was not returned');
		return { tokens, user };
	},

	register: async (data: object): Promise<AuthResponse> => {
		const response = await api.post(ENDPOINTS.auth.register, data);
		const result = responseData<AuthResponse>(response);
		await saveTokens(result.tokens);
		return result;
	},

	refreshAccessToken: async (refreshToken: string): Promise<AuthTokens | null> => {
		if (!auth?.currentUser || !refreshToken) return null;
		const tokens: AuthTokens = {
			accessToken: await auth.currentUser.getIdToken(true),
			refreshToken,
			expiresIn: 3600,
			tokenType: 'Bearer',
		};
		await saveTokens(tokens);
		return tokens;
	},

	getCurrentUser,

	logout: async (): Promise<void> => {
		try {
			await api.post(ENDPOINTS.auth.logout);
		} finally {
			await clearTokens();
		}
	},

	updateProfile: async (data: Partial<User>): Promise<User> => {
		const response = await api.put(ENDPOINTS.user.updateProfile, data);
		return responseData<{ user: User }>(response).user;
	},

	updateFCMToken: async (token: string): Promise<void> => {
		await api.post(ENDPOINTS.user.updateFcmToken, { token });
	},

	enableBiometric: async (): Promise<boolean> => storage.set('biometric_enabled', true),

	disableBiometric: async (): Promise<void> => {
		await storage.remove('biometric_enabled');
	},
};
