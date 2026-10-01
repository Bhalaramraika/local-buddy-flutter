/**
 * Payment Service (PayU only)
 *
 * Flow: POST /wallet/add-money → backend returns signed PayU params →
 * app renders the hosted checkout in a WebView → PayU redirects to backend
 * callback (hash verified server-side) → app intercepts the final redirect
 * URL and refreshes the wallet. NO client-side hashing, NO paise math.
 */

import { apiPost, apiGet } from './api';

export interface PayUInitResponse {
  success: boolean;
  payuParams: Record<string, string>;
  payuUrl: string;
  transactionId: string;
}

export interface TopupResult {
  success: boolean;
  status?: 'success' | 'failed';
  transactionId?: string;
  error?: string;
}

/** Start a wallet top-up; returns params to render the PayU hosted checkout. */
export const initWalletTopup = async (amountInr: number): Promise<PayUInitResponse> => {
  if (!Number.isFinite(amountInr) || amountInr <= 0) {
    throw new Error('Enter a valid amount');
  }
  return apiPost<PayUInitResponse>('/wallet/add-money', {
    amount: amountInr,
    paymentMode: 'payu',
  });
};

/** Build the auto-submitting HTML form for the PayU hosted checkout WebView. */
export const buildPayUHtml = (params: Record<string, string>, action: string): string => {
  const fields = Object.entries(params)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}" />`)
    .join('');
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif">
<p>Redirecting to PayU…</p>
<form id="f" method="post" action="${action}">${fields}</form>
<script>document.getElementById('f').submit();</script>
</body></html>`;
};

/**
 * Interpret a WebView URL to decide if the PayU flow has finished.
 * The backend callback redirects to `${APP_URL}/wallet?status=...&txnid=...`,
 * plus accepts deep links `localbuddy://wallet?...`.
 */
export const parsePayURedirect = (
  url: string
): { done: true; status: 'success' | 'failed'; txnid?: string } | { done: false } => {
  if (!url) return { done: false };
  const m = url.match(/[?&]status=(\w+)/);
  const t = url.match(/[?&]txnid=([\w_-]+)/);
  const isWalletResult = /\/wallet(\?|$)/.test(url) && !!m;
  if (isWalletResult || /payu\/callback/.test(url)) {
    return { done: true, status: m?.[1] === 'success' ? 'success' : 'failed', txnid: t?.[1] };
  }
  return { done: false };
};

/** Refresh wallet data after a payment completes. */
export const refreshWalletAfterPayment = async (): Promise<{ balance: number } | null> => {
  const res = await apiGet<{ success: boolean; wallet: { balance: number } }>('/wallet');
  return res?.wallet ?? null;
};
