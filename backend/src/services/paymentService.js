// backend/src/services/paymentService.js
const supabase = require('../lib/supabase');
const logger = require('../utils/logger');

const PLANS = {
  free: { listings: 3 },
  basic: { listings: 10 },
  pro: { listings: 25 },
  business: { listings: 50 }
};

class PaymentService {
  constructor() {
    this.simulatePayment = true; // Set to false for real payment integration
  }

  // ============================================
  // Create Payment Intent
  // ============================================
  async createPaymentIntent({ userId, plan, amount, currency, method }) {
    try {
      // For now, simulate payment
      if (this.simulatePayment) {
        const paymentId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        logger.info(`Simulated payment intent created for user ${userId}:`, {
          plan,
          amount,
          currency,
          method,
          paymentId
        });
        
        return {
          id: paymentId,
          clientSecret: `sim_secret_${paymentId}`,
          status: 'requires_confirmation'
        };
      }

      // Real payment integration would go here
      // e.g., Stripe, Airtel Money API, etc.
      throw new Error('Payment integration not implemented');

    } catch (error) {
      logger.error('Create payment intent error:', error);
      throw error;
    }
  }

  // ============================================
  // Verify Payment
  // ============================================
  async verifyPayment(paymentId) {
    try {
      // For now, simulate verification
      if (this.simulatePayment) {
        logger.info(`Simulated payment verification for: ${paymentId}`);
        
        // Extract plan from payment ID (for demo purposes)
        const plan = paymentId.includes('basic') ? 'basic' :
                    paymentId.includes('pro') ? 'pro' :
                    paymentId.includes('business') ? 'business' : 'free';
        
        return {
          success: true,
          plan: plan,
          status: 'succeeded',
          paymentId: paymentId
        };
      }

      // Real payment verification would go here
      throw new Error('Payment verification not implemented');

    } catch (error) {
      logger.error('Verify payment error:', error);
      throw error;
    }
  }

  // ============================================
  // Update Subscription
  // ============================================
  async updateSubscription({ userId, plan, paymentId }) {
    try {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days subscription
      
      // Get current subscription to preserve listings_used
      const current = await this.getSubscription(userId);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: plan,
          listings_allowed: PLANS[plan]?.listings || 3,
          listings_used: current?.listings_used || 0,
          status: 'active',
          payment_id: paymentId,
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      logger.info(`Subscription updated for user ${userId}:`, { plan, paymentId });
      
      return {
        success: true,
        user_id: userId,
        plan: plan,
        expires_at: expiresAt,
        listings_allowed: PLANS[plan]?.listings || 3,
        listings_used: current?.listings_used || 0,
        remaining_listings: (PLANS[plan]?.listings || 3) - (current?.listings_used || 0)
      };

    } catch (error) {
      logger.error('Update subscription error:', error);
      throw error;
    }
  }

  // ============================================
  // Get Subscription
  // ============================================
  async getSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Create free subscription if none exists
        return this.createFreeSubscription(userId);
      }

      // Check if subscription has expired
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      if (expiresAt < now && data.plan !== 'free') {
        // Downgrade to free
        return this.downgradeToFree(userId);
      }

      return {
        ...data,
        plan: data.plan || 'free',
        listings_allowed: data.listings_allowed || PLANS.free.listings,
        listings_used: data.listings_used || 0,
        remaining_listings: (data.listings_allowed || PLANS.free.listings) - (data.listings_used || 0),
        status: data.status || 'active'
      };

    } catch (error) {
      logger.error('Get subscription error:', error);
      // Return default free plan
      return {
        plan: 'free',
        listings_allowed: PLANS.free.listings,
        listings_used: 0,
        remaining_listings: PLANS.free.listings,
        status: 'active'
      };
    }
  }

  // ============================================
  // Create Free Subscription
  // ============================================
  async createFreeSubscription(userId) {
    try {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 100); // Free plan never expires
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'free',
          listings_allowed: PLANS.free.listings,
          listings_used: 0,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          created_at: now.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      logger.info(`Free subscription created for user ${userId}`);
      
      return {
        ...data,
        plan: 'free',
        listings_allowed: PLANS.free.listings,
        listings_used: 0,
        remaining_listings: PLANS.free.listings,
        status: 'active'
      };

    } catch (error) {
      logger.error('Create free subscription error:', error);
      throw error;
    }
  }

  // ============================================
  // Downgrade to Free
  // ============================================
  async downgradeToFree(userId) {
    try {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          listings_allowed: PLANS.free.listings,
          status: 'expired',
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      logger.info(`User ${userId} downgraded to free plan`);
      
      return {
        ...data,
        plan: 'free',
        listings_allowed: PLANS.free.listings,
        listings_used: 0,
        remaining_listings: PLANS.free.listings,
        status: 'active'
      };

    } catch (error) {
      logger.error('Downgrade to free error:', error);
      throw error;
    }
  }

  // ============================================
  // Check if user can create listing
  // ============================================
  async canCreateListing(userId) {
    try {
      const subscription = await this.getSubscription(userId);
      return (subscription.listings_used || 0) < (subscription.listings_allowed || PLANS.free.listings);
    } catch (error) {
      logger.error('Check can create listing error:', error);
      return false;
    }
  }

  // ============================================
  // Increment listing usage
  // ============================================
  async incrementListingUsage(userId) {
    try {
      const subscription = await this.getSubscription(userId);
      
      if ((subscription.listings_used || 0) >= (subscription.listings_allowed || PLANS.free.listings)) {
        throw new Error('Listing limit exceeded');
      }
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          listings_used: (subscription.listings_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      return {
        success: true,
        listings_used: data.listings_used,
        listings_allowed: data.listings_allowed,
        remaining_listings: data.listings_allowed - data.listings_used
      };

    } catch (error) {
      logger.error('Increment listing usage error:', error);
      throw error;
    }
  }

  // ============================================
  // Handle Payment Success
  // ============================================
  async handlePaymentSuccess(paymentIntent) {
    try {
      logger.info('Payment succeeded:', paymentIntent);
      // Update subscription based on payment
      // This would be called from webhook
      // Implementation depends on your payment provider
    } catch (error) {
      logger.error('Handle payment success error:', error);
    }
  }

  // ============================================
  // Handle Payment Failure
  // ============================================
  async handlePaymentFailure(paymentIntent) {
    try {
      logger.info('Payment failed:', paymentIntent);
      // Handle failed payment
    } catch (error) {
      logger.error('Handle payment failure error:', error);
    }
  }

  // ============================================
  // Verify Webhook Signature
  // ============================================
  async verifyWebhookSignature(rawBody, signature) {
    // Implement webhook signature verification
    // For now, return true for simulation
    return true;
  }
}

module.exports = new PaymentService();