//environment.ts
export const environment = {
    production: false,
    baseUrl: 'http://localhost:6388', // Make sure this matches your backend port
    apiUrl: 'http://localhost:6388/api',
    mediaUrl: 'http://localhost:6388/api/media',
    stripePublishableKey: 'pk_test_51Qk30cCBesEmSvdxhucmWz9GIyHGcVSr3Vh9Yy6zAfuW9yywoitramCgcORm8POdZFaDFsvMa530gKazpayJa7Tv00Oe4sEDtx',
    secretKey: "sk_test_51Qk30cCBesEmSvdxJO1xGSdWtbmBMuqJpf57ANsSHVfCJeyLeXEJJs65vNxWbwlKwdtEgatt3k5a6HfFshkPA0sq006tZj72IL",
    hCaptchaSiteKey:'881e6b0e-58d6-4d80-818a-a0665802e6c0',
    binancePay: {
        apiKey: 'YOUR_BINANCE_API_KEY',
        secretKey: 'YOUR_BINANCE_SECRET_KEY',
        apiUrl: 'https://api.binance.com/api/v1',
        merchantId: 'YOUR_MERCHANT_ID'
    },
    // csp: {
    //     allowUnsafeEval: true, // Set to false in production
    //     allowUnsafeInline: true, // Set to false in production
    //     allowBybit: true,
    //     trustedDomains: [
    //         'https://*.bybit.com',
    //         'wss://*.bybit.com'
    //     ]
    // },
    // bybit: {
    //     apiKey: 'YOUR_BYBIT_API_KEY',
    //     apiEndpoint: 'https://api.bybit.com'
    // }
};
