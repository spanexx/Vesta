import express from 'express';
import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import UserProfile from '../models/UserProfile.js'; // Add this import
import auth from '../middleware/auth.js';
import createErrorResponse from '../utils/errorHandler.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { amount, currency, serviceDetails } = req.body;
    const normalizedCurrency = currency.toUpperCase();

    // Validate required fields
    if (!amount || !currency || !serviceDetails) {
      return res.status(400).json({ 
        error: 'INVALID_REQUEST',
        message: 'Amount, currency and serviceDetails are required' 
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        error: 'INVALID_AMOUNT',
        message: 'Amount must be greater than 0'
      });
    }

    // Validate currency is supported
    if (!['USD', 'EUR', 'GBP'].includes(normalizedCurrency)) {
      return res.status(400).json({
        error: 'INVALID_CURRENCY',
        message: 'Currency must be one of: USD, EUR, GBP'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents and ensure integer
      currency: normalizedCurrency.toLowerCase(), // Stripe needs lowercase
      metadata: {
        userId: req.userId,
        serviceDetails: JSON.stringify(serviceDetails)
      }
    });

    const payment = new Payment({
      userId: req.userId,
      amount,
      currency: normalizedCurrency, // Use normalized currency
      stripePaymentId: paymentIntent.id,
      serviceDetails
    });

    await payment.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    
    // Send more specific error messages
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: 'CARD_ERROR',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'PAYMENT_CREATION_FAILED',
      message: error.message || 'An error occurred while creating the payment'
    });
  }
});

// Create subscription
router.post('/create-subscription', auth, async (req, res) => {
  try {
    const { amount, currency, serviceDetails, interval, paymentMethodId } = req.body;
    const normalizedCurrency = currency.toUpperCase();

    if (!paymentMethodId) {
      return res.status(400).json({
        error: 'PAYMENT_METHOD_REQUIRED',
        message: 'Payment method is required'
      });
    }

    // Find user profile first
    const userProfile = await UserProfile.findById(req.userId);
    if (!userProfile) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User profile not found'
      });
    }

    // Create or get Stripe customer
    let customer;
    try {
      if (!userProfile.stripeCustomerId) {
        // Create new customer with payment method
        customer = await stripe.customers.create({
          email: userProfile.email,
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });

        // Save customer ID to user profile
        await UserProfile.findByIdAndUpdate(req.userId, {
          stripeCustomerId: customer.id
        });
      } else {
        customer = await stripe.customers.retrieve(userProfile.stripeCustomerId);
        
        // Attach payment method to existing customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id
        });

        // Set as default payment method
        await stripe.customers.update(customer.id, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }
    } catch (stripeError) {
      console.error('Stripe customer/payment method error:', stripeError);
      return res.status(500).json({
        error: 'STRIPE_CUSTOMER_ERROR',
        message: stripeError.message
      });
    }

    // Create subscription price
    let price;
    try {
      price = await stripe.prices.create({
        currency: normalizedCurrency.toLowerCase(),
        unit_amount: Math.round(amount * 100),
        recurring: { interval },
        product_data: {
          name: `${serviceDetails.plan} Plan`,
          metadata: {
            type: serviceDetails.type
          }
        }
      });
    } catch (priceError) {
      console.error('Price creation error:', priceError);
      return res.status(500).json({
        error: 'PRICE_CREATION_ERROR',
        message: priceError.message
      });
    }

    // Create subscription
    let subscription;
    try {
      subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent']
      });
    } catch (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
      return res.status(500).json({
        error: 'SUBSCRIPTION_CREATION_ERROR',
        message: subscriptionError.message
      });
    }

    // Create payment record
    const payment = new Payment({
      userId: req.userId,
      amount,
      currency: normalizedCurrency,
      stripePaymentId: subscription.latest_invoice.payment_intent.id,
      serviceDetails: {
        ...serviceDetails,
        subscriptionId: subscription.id
      }
    });

    await payment.save();

    res.json({
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({
      error: 'SUBSCRIPTION_CREATION_FAILED',
      message: error.message
    });
  }
});

// Create Binance Pay payment
router.post('/create-binance-payment', auth, async (req, res) => {
  try {
    const { amount, serviceDetails } = req.body;

    // Create a unique order ID
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create payment record
    const payment = new Payment({
      userId: req.userId,
      amount,
      currency: 'USDT',
      type: 'crypto',
      status: 'pending',
      stripePaymentId: orderId, // Using orderId as payment ID
      serviceDetails
    });

    await payment.save();

    // Call Binance Pay API
    // This will be implemented when you get the API credentials
    const binanceResponse = await createBinancePayment(orderId, amount, serviceDetails.description);

    res.json({
      paymentId: payment._id,
      ...binanceResponse
    });
  } catch (error) {
    console.error('Binance payment creation error:', error);
    res.status(500).json({
      error: 'PAYMENT_CREATION_FAILED',
      message: error.message
    });
  }
});

// Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const payment = await Payment.findOneAndUpdate(
          { stripePaymentId: paymentIntent.id },
          { status: 'completed' }
        );

        if (payment) {
          // Get plan level from service details
          const planLevel = payment.serviceDetails.plan.toLowerCase();
          console.log('Updating profile level to:', planLevel);

          if(['standard', 'premium', 'vip'].includes(planLevel)) {
            await UserProfile.findByIdAndUpdate(
              payment.userId,
              { 
                profileLevel: planLevel,
                // Also update verification status if VIP
                ...(planLevel === 'vip' ? { 
                  verificationStatus: 'verified',
                  verified: true
                } : {})
              }
            );
            console.log('Profile level updated for user:', payment.userId);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const customerId = invoice.customer;
        
        const userProfile = await UserProfile.findOne({ stripeCustomerId: customerId });
        
        if (userProfile) {
          // Extract subscription details from metadata
          const subscriptionType = subscription.metadata.type || 'profile';
          const planName = subscription.items.data[0].price.product.name.toLowerCase();

          if (subscriptionType === 'video') {
            // Handle video subscription
            await UserProfile.findByIdAndUpdate(
              userProfile._id,
              {
                videoSubscription: {
                  isSubscribed: true,
                  subscribedAt: new Date(),
                  expiresAt: new Date(subscription.current_period_end * 1000)
                }
              }
            );
            console.log('Video subscription updated for user:', userProfile._id);
          } else {
            // Handle profile subscription
            const planLevel = planName.includes('vip') ? 'vip' : 
                            planName.includes('premium') ? 'premium' : 'standard';

            await UserProfile.findByIdAndUpdate(
              userProfile._id,
              { 
                profileLevel: planLevel,
                ...(planLevel === 'vip' ? { 
                  verificationStatus: 'verified',
                  verified: true
                } : {})
              }
            );
          }
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        await UserProfile.findOneAndUpdate(
          { stripeCustomerId: updatedSubscription.customer },
          {
            'subscription.stripeSubscriptionId': updatedSubscription.id,
            'subscription.currentPeriodEnd': new Date(updatedSubscription.current_period_end * 1000),
            'subscription.status': updatedSubscription.status === 'active' ? 'active' : 'canceled'
          }
        );
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await UserProfile.findOneAndUpdate(
          { stripeCustomerId: deletedSubscription.customer },
          {
            profileLevel: 'free',
            'subscription.status': 'expired'
          }
        );
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default router;
