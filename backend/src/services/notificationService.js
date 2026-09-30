// backend/src/services/notificationService.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class NotificationService {
  // ============================================
  // CORE
  // ============================================
  async createNotification(userId, type, title, message, link = null, data = null) {
    try {
      const insertRow = {
        user_id: userId,
        type: type,
        title: title,
        message: message,
        link: link,
        read: false,
        created_at: new Date().toISOString(),
      };

      // Optional JSONB payload (best-effort — column may not exist)
      if (data) insertRow.data = data;

      const { data: inserted, error } = await supabase
        .from('notifications')
        .insert(insertRow)
        .select()
        .single();

      if (error) throw error;

      return { success: true, notification: inserted };
    } catch (error) {
      console.error('Create notification error:', error?.message || error);
      return { success: false, error: error?.message || 'Failed to create notification' };
    }
  }

  async getUserNotifications(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (countError) throw countError;

      return {
        success: true,
        notifications: data || [],
        unreadCount: count || 0,
      };
    } catch (error) {
      console.error('Get notifications error:', error?.message || error);
      return { success: false, error: error?.message || 'Failed to fetch notifications' };
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Mark as read error:', error?.message || error);
      return { success: false, error: error?.message || 'Failed to mark as read' };
    }
  }

  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Mark all as read error:', error?.message || error);
      return { success: false, error: error?.message || 'Failed to mark all as read' };
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Delete notification error:', error?.message || error);
      return { success: false, error: error?.message || 'Failed to delete notification' };
    }
  }

  // ============================================
  // LISTINGS
  // ============================================
  async notifyNewListing(listing, business) {
    try {
      const { data: interestedUsers } = await supabase
        .from('user_preferences')
        .select('user_id')
        .eq('category', listing.category);

      if (interestedUsers && interestedUsers.length > 0) {
        for (const user of interestedUsers) {
          await this.createNotification(
            user.user_id,
            'new_listing',
            `New ${listing.category} available!`,
            `${business.business_name} posted: ${listing.title}`,
            `/listing/${listing.id}`
          );
        }
      }

      await this.createNotification(
        business.user_id,
        'listing_created',
        'Your listing is live!',
        `${listing.title} is now visible to customers in Mitundu.`,
        `/dashboard`
      );

      return { success: true };
    } catch (error) {
      console.error('Notify new listing error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  async notifyNewContact(listing, business, customer) {
    try {
      await this.createNotification(
        business.user_id,
        'new_contact',
        'New customer inquiry!',
        `${customer.full_name || 'Someone'} is interested in: ${listing.title}`,
        `/listing/${listing.id}`
      );

      return { success: true };
    } catch (error) {
      console.error('Notify new contact error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  // ============================================
  // ★ PHASE 5K: REQUEST NOTIFICATIONS
  // ============================================
  async notifyRequestResponse({
    requestOwnerId,
    requestId,
    requestTitle,
    responderName,
    offeredPrice = null,
  }) {
    try {
      const priceSuffix = offeredPrice
        ? ` — offered MK ${Number(offeredPrice).toLocaleString()}`
        : '';

      await this.createNotification(
        requestOwnerId,
        'request_response',
        'New response to your request',
        `${responderName || 'Someone'} responded to "${requestTitle}"${priceSuffix}`,
        `/requests/${requestId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyRequestResponse error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  async notifyResponseAccepted({
    responderId,
    requestId,
    requestTitle,
    conversationId = null,
  }) {
    try {
      await this.createNotification(
        responderId,
        'request_accepted',
        'Your response was accepted 🎉',
        `Your offer for "${requestTitle}" was accepted. Open the chat to arrange details.`,
        conversationId ? `/chat/${conversationId}` : `/requests/${requestId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyResponseAccepted error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  async notifyRequestFulfilled({
    responderId,
    requestId,
    requestTitle,
  }) {
    try {
      await this.createNotification(
        responderId,
        'request_fulfilled',
        'Request marked as fulfilled ✅',
        `The request "${requestTitle}" has been fulfilled. Your trust score just went up.`,
        `/requests/${requestId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyRequestFulfilled error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  // ============================================
  // ★ PHASE 6J: DELIVERY NOTIFICATIONS
  // ============================================

  /**
   * Courier accepted a delivery job.
   * Fires to the POSTER (the person who needs the delivery).
   */
  async notifyDeliveryAccepted({
    posterId,
    deliveryId,
    deliveryTitle,
    courierName,
  }) {
    try {
      await this.createNotification(
        posterId,
        'delivery_accepted',
        'A courier accepted your delivery 🚚',
        `${courierName || 'A courier'} is on it: "${deliveryTitle}". They'll pick up soon.`,
        `/deliveries/${deliveryId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyDeliveryAccepted error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  /**
   * Courier marked the package picked up.
   * Fires to the POSTER.
   */
  async notifyDeliveryPickedUp({
    posterId,
    deliveryId,
    deliveryTitle,
    courierName,
  }) {
    try {
      await this.createNotification(
        posterId,
        'delivery_picked_up',
        'Your package is on the way 📦',
        `${courierName || 'Your courier'} picked up "${deliveryTitle}".`,
        `/deliveries/${deliveryId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyDeliveryPickedUp error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  /**
   * Poster confirmed the delivery.
   * Fires to the COURIER.
   */
  async notifyDeliveryConfirmed({
    courierId,
    deliveryId,
    deliveryTitle,
    posterName,
  }) {
    try {
      await this.createNotification(
        courierId,
        'delivery_confirmed',
        'Delivery confirmed ✅',
        `${posterName || 'The poster'} confirmed "${deliveryTitle}". Your trust score just went up.`,
        `/deliveries/${deliveryId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyDeliveryConfirmed error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }
}

export default new NotificationService();