// backend/src/api/payment.js
import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook to handle Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handleFailedPayment(failedPayment);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleSuccessfulPayment(paymentIntent) {
  const { metadata, id, amount, currency } = paymentIntent;
  
  // Save order to database
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: metadata.userId,
      project_id: metadata.projectId,
      payment_intent_id: id,
      amount: amount / 100,
      currency,
      status: 'completed',
      metadata
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving order:', error);
    throw error;
  }

  // Update project status if applicable
  if (metadata.projectId) {
    await supabase
      .from('projects')
      .update({ status: 'active' })
      .eq('id', metadata.projectId);
  }

  return data;
}

async function handleFailedPayment(paymentIntent) {
  const { metadata, id } = paymentIntent;
  
  await supabase
    .from('orders')
    .insert({
      user_id: metadata.userId,
      project_id: metadata.projectId,
      payment_intent_id: id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'failed',
      metadata
    });
}

// Get payment methods
router.get('/payment-methods', async (req, res) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      type: 'card',
    });

    res.json(paymentMethods.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;