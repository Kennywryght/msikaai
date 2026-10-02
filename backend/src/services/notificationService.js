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
  // REQUEST NOTIFICATIONS
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

  // ★ PHASE 2 ADDENDUM
  async notifyResponseRejected({
    responderId,
    requestId,
    requestTitle,
    reason = null,
  }) {
    try {
      const body = reason
        ? `Your response to "${requestTitle}" was declined. Reason: ${reason}`
        : `Your response to "${requestTitle}" was declined.`;

      await this.createNotification(
        responderId,
        'request_rejected',
        'Response declined',
        body,
        `/requests/${requestId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyResponseRejected error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  async notifyRequestFulfilled({ responderId, requestId, requestTitle }) {
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
  // NEGOTIATION NOTIFICATIONS
  // ============================================
  async notifyCounterOfferReceived({
    responderId,
    requestId,
    requestTitle,
    ownerName,
    counterPrice,
    conversationId,
  }) {
    try {
      const priceStr = Number(counterPrice).toLocaleString();
      await this.createNotification(
        responderId,
        'counter_offer',
        'Counter offer received 💰',
        `${ownerName || 'The request owner'} countered with MK ${priceStr} for "${requestTitle}".`,
        conversationId ? `/chat/${conversationId}` : `/requests/${requestId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyCounterOfferReceived error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  async notifyProposalAccepted({
    recipientId,
    requestId,
    requestTitle,
    conversationId,
    acceptedPrice,
    accepterName,
  }) {
    try {
      const priceStr = acceptedPrice ? Number(acceptedPrice).toLocaleString() : null;
      const body = priceStr
        ? `${accepterName || 'They'} accepted your offer of MK ${priceStr} for "${requestTitle}".`
        : `${accepterName || 'They'} accepted your offer for "${requestTitle}".`;

      await this.createNotification(
        recipientId,
        'proposal_accepted',
        'Offer accepted 🎉',
        body,
        conversationId ? `/chat/${conversationId}` : `/requests/${requestId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyProposalAccepted error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  async notifyProposalDeclined({
    recipientId,
    requestId,
    requestTitle,
    conversationId,
    declinedPrice,
    declinerName,
  }) {
    try {
      const priceStr = declinedPrice ? Number(declinedPrice).toLocaleString() : null;
      const body = priceStr
        ? `${declinerName || 'They'} declined your offer of MK ${priceStr} for "${requestTitle}".`
        : `${declinerName || 'They'} declined your offer for "${requestTitle}".`;

      await this.createNotification(
        recipientId,
        'proposal_declined',
        'Offer declined',
        body,
        conversationId ? `/chat/${conversationId}` : `/requests/${requestId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyProposalDeclined error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  // ============================================
  // DELIVERY NOTIFICATIONS (Phase 6J)
  // ============================================
  async notifyDeliveryAccepted({ posterId, deliveryId, deliveryTitle, courierName }) {
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

  async notifyDeliveryPickedUp({ posterId, deliveryId, deliveryTitle, courierName }) {
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

  async notifyDeliveryConfirmed({ courierId, deliveryId, deliveryTitle, posterName }) {
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

  // ============================================
  // ★ PHASE 3: COURIER APPROVAL NOTIFICATIONS
  // ============================================

  /**
   * Fires to the seller + buyer when a courier requests a job.
   * Called once per reviewer (they each get their own row).
   */
  async notifyCourierRequestReceived({
    reviewerId,
    deliveryId,
    deliveryTitle,
    courierName,
    isBuyer = false,
  }) {
    try {
      const role = isBuyer ? 'buyer' : 'seller';
      await this.createNotification(
        reviewerId,
        'courier_request',
        `New courier request (${role})`,
        `${courierName || 'A courier'} wants to deliver "${deliveryTitle}". Review their request.`,
        `/deliveries/${deliveryId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyCourierRequestReceived error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  /**
   * Fires to the courier when their request is approved and they become assigned.
   */
  async notifyCourierApproved({
    courierId,
    deliveryId,
    deliveryTitle,
    approvedBy,
  }) {
    try {
      await this.createNotification(
        courierId,
        'courier_approved',
        'You got the job! 🎉',
        `Your request for "${deliveryTitle}" was approved. Head to pickup.`,
        `/deliveries/${deliveryId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyCourierApproved error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  /**
   * Fires to the courier when their request is rejected.
   */
  async notifyCourierRejected({
    courierId,
    deliveryId,
    deliveryTitle,
    reason = null,
  }) {
    try {
      const body = reason
        ? `Your request for "${deliveryTitle}" was declined. Reason: ${reason}`
        : `Your request for "${deliveryTitle}" was declined.`;

      await this.createNotification(
        courierId,
        'courier_rejected',
        'Courier request declined',
        body,
        `/deliveries/${deliveryId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyCourierRejected error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }

  /**
   * Fires to a courier whose request was auto-rejected because someone else got the job.
   */
  async notifyCourierRequestAutoRejected({
    courierId,
    deliveryId,
    deliveryTitle,
  }) {
    try {
      await this.createNotification(
        courierId,
        'courier_auto_rejected',
        'Job taken by another courier',
        `"${deliveryTitle}" was assigned to another courier. Check other jobs on the board.`,
        `/deliveries/${deliveryId}`
      );

      return { success: true };
    } catch (error) {
      console.error('notifyCourierRequestAutoRejected error:', error?.message || error);
      return { success: false, error: error?.message };
    }
  }
}

export default new NotificationService();