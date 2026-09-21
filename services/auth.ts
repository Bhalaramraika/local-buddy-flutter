import { api, ENDPOINTS, isMockApiEnabled } from './api';
import { auth } from './firebase';
import { authStorage, storage } from './storage';
import { AuthTokens, User } from '@/types';
import { signInWithCustomToken } from 'firebase/auth';

interface AuthResponse {
	tokens: AuthTokens;
	user: User;
}

export const normalizePhoneNumber = (phone: string): string => {
	const digits = phone.replace(/\D/g, '');
	if (digits.length === 10) return `+91${digits}`;
	if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
	return phone.trim();
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

const createMockUser = (phone: string): User => ({
	id: `local-${phone.replace(/\D/g, '')}`,
	phone,
	name: `Local User ${phone.slice(-4)}`,
	role: 'customer',
	status: 'active',
	isActive: true,
	language: 'en',
	city: '',
	kyc: { status: 'not_started', documents: [] },
	wallet: { balance: 0, pendingBalance: 0, currency: 'INR', bankAccounts: [] },
	rating: { average: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
	stats: { tasksCompleted: 0, tasksPosted: 0, totalEarnings: 0, totalSpent: 0, responseTime: 0, completionRate: 100 },
	preferences: { notifications: { push: true, inApp: true, email: true, sms: true, categories: { task: true, chat: true, wallet: true, kyc: true, system: true, promo: true, sos: true, review: true }, quietHours: { enabled: false, start: '22:00', end: '07:00' } }, privacy: { showProfile: true, showRating: true, showLocation: false, allowDirectMessages: true }, appearance: { theme: 'system', language: 'en', fontSize: 'medium' }, location: { shareLocation: false, autoAcceptNearby: false, maxDistance: 10 } },
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	lastActiveAt: new Date().toISOString(),
});

const mockTokens = (phone: string): AuthTokens => ({
	accessToken: `local-access-${phone}`,
	refreshToken: `local-refresh-${phone}`,
	expiresIn: 86400,
	tokenType: 'Bearer',
});

export const getCurrentUser = async (): Promise<User | null> => {
	if (isMockApiEnabled) return storage.get<User>('local_mock_user');
	const response = await api.get('/auth/me');
	return responseData<{ user: User }>(response).user;
};

export const authService = {
	getStoredTokens,
	clearTokens,
	requestOtp: async (phone: string): Promise<void> => {
		if (isMockApiEnabled) {
			await storage.set('local_mock_otp', '123456');
			return;
		}
		await api.post(ENDPOINTS.auth.otpSend, { phone: normalizePhoneNumber(phone) });
	},

	validateToken: async (token: string): Promise<boolean> => {
		if (isMockApiEnabled) return token.startsWith('local-access-');
		if (!auth?.currentUser || !token) return false;
		try {
			await auth.currentUser.getIdToken();
			return true;
		} catch {
			return false;
		}
	},

	login: async (phone: string, otp: string): Promise<AuthResponse> => {
		const normalizedPhone = normalizePhoneNumber(phone);
		if (isMockApiEnabled) {
			const expectedOtp = await storage.get<string>('local_mock_otp');
			if (otp !== (expectedOtp || '123456')) throw new Error('Invalid development OTP. Use 123456.');
			const existingUser = await storage.get<User>('local_mock_user');
			const user = existingUser || createMockUser(normalizedPhone);
			const tokens = mockTokens(normalizedPhone);
			await Promise.all([saveTokens(tokens), storage.set('local_mock_user', user)]);
			return { tokens, user };
		}
		const response = await api.post(ENDPOINTS.auth.otpVerify, { phone: normalizedPhone, otp });
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
		if (isMockApiEnabled) {
			const currentUser = (await storage.get<User>('local_mock_user')) || createMockUser('');
			const updatedUser = { ...currentUser, ...data, updatedAt: new Date().toISOString() };
			await storage.set('local_mock_user', updatedUser);
			return updatedUser;
		}
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
