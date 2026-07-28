import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class NotificationService {
  // Create notification
  async createNotification(userId, type, title, message, link = null) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: type,
          title: title,
          message: message,
          link: link,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, notification: data };
    } catch (error) {
      console.error('Create notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get unread count
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (countError) throw countError;

      return {
        success: true,
        notifications: data || [],
        unreadCount: count || 0
      };
    } catch (error) {
      console.error('Get notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark notification as read
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
      console.error('Mark as read error:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark all as read
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Mark all as read error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete notification
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
      console.error('Delete notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notifications for new listing
  async notifyNewListing(listing, business) {
    try {
      // Get users who might be interested (based on category)
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

      // Notify the business owner about their listing
      await this.createNotification(
        business.user_id,
        'listing_created',
        'Your listing is live!',
        `${listing.title} is now visible to customers in Mitundu.`,
        `/dashboard`
      );

      return { success: true };
    } catch (error) {
      console.error('Notify new listing error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification for new contact
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
      console.error('Notify new contact error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new NotificationService();