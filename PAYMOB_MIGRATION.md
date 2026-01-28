# Paymob API Migration Guide

## Overview

This project has been updated to use Paymob's new **Intention API** (v1), which simplifies the payment flow from a 3-step process to a single API call.

## What Changed?

### Old API Flow (Deprecated)
1. POST `/auth/tokens` - Authenticate and get token
2. POST `/ecommerce/orders` - Register order
3. POST `/acceptance/payment_keys` - Get payment key
4. Redirect to iframe with payment token

### New Intention API Flow
1. POST `/v1/intention/` - Create payment intention (single step)
2. Redirect to unified checkout URL

## Environment Variables

### Required New Variables

Add these to your `.env` file:

```bash
# Paymob Secret Key (replaces API_KEY)
PAYMOB_SECRET_KEY=your_secret_key_here

# Paymob Public Key (new requirement)
PAYMOB_PUBLIC_KEY=your_public_key_here

# Integration ID (same as before)
PAYMOB_INTEGRATION_ID=your_integration_id_here

# Optional: Custom API base URL (defaults to https://accept.paymob.com/api)
PAYMOB_API_BASE=https://accept.paymob.com/api

# Required for payment redirects
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Removed Variables

These are no longer needed:
- `PAYMOB_API_KEY` (replaced by `PAYMOB_SECRET_KEY`)
- `PAYMOB_IFRAME_ID` (unified checkout doesn't use iframe IDs)

### Where to Find Your Keys

1. Log in to your [Paymob Dashboard](https://accept.paymob.com/)
2. Go to **Settings** → **Account Info** → **API Keys**
3. Copy your:
   - **Secret Key** (starts with `sk_`)
   - **Public Key** (starts with `pk_`)
   - **Integration ID** (numeric value)

## HMAC Verification

The HMAC secret for webhook verification remains the same:

```bash
PAYMOB_HMAC_SECRET=your_hmac_secret_here
```

## API Changes Summary

### Authentication
- **Old**: Bearer token from `/auth/tokens`
- **New**: `Authorization: Token <SECRET_KEY>` header

### Payment Creation
- **Old**: 3 separate API calls
- **New**: Single `/v1/intention/` endpoint

### Response Structure
- **Old**: Returns `payment_token` and uses iframe ID
- **New**: Returns `client_secret` and `iframe_url` for unified checkout

## Code Changes

### Before (Old API)
```typescript
// 3-step process
const authToken = await authenticate()
const orderId = await registerOrder({ authToken, ... })
const paymentToken = await requestPaymentKey({ authToken, orderId, ... })
const iframeUrl = `${BASE_URL}/acceptance/iframes/${IFRAME_ID}?payment_token=${paymentToken}`
```

### After (New Intention API)
```typescript
// Single step
const intention = await createIntention({ amountCents, currency, items, billingData, ... })
const iframeUrl = intention.iframe_url
// or construct: https://accept.paymob.com/unifiedcheckout/?publicKey=${PUBLIC_KEY}&clientSecret=${client_secret}
```

## Migration Checklist

- [ ] Get Secret Key from Paymob Dashboard
- [ ] Get Public Key from Paymob Dashboard
- [ ] Update `.env` file with new variables
- [ ] Remove old `PAYMOB_API_KEY` and `PAYMOB_IFRAME_ID` variables
- [ ] Test payment flow in development
- [ ] Verify webhook still works (HMAC unchanged)
- [ ] Test payment status redirects
- [ ] Deploy to production

## Testing

1. Create a test payment in your application
2. Verify the checkout URL loads correctly
3. Complete a test transaction
4. Check that webhooks are received and processed
5. Verify order status updates correctly

## Benefits of New API

- **Simpler**: One API call instead of three
- **Faster**: Reduced latency from fewer round trips
- **More Secure**: Direct secret key authentication
- **Better UX**: Unified checkout experience
- **Modern**: Follows current payment industry standards

## Support

- [Paymob Documentation](https://developers.paymob.com/egypt/checkout/integration-guide-and-api-reference/intention-payment-api)
- [Paymob Developer Portal](https://developers.paymob.com/)
- [Paymob Support](https://paymob.com/en/checkout)

## Rollback Plan

If you need to rollback to the old API temporarily:

1. Restore the old `lib/payments/paymob.ts` from git history
2. Restore environment variables
3. Contact Paymob support about extended old API support
