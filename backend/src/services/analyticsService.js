import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class AnalyticsService {
  // Track listing view
  async trackView(listingId, userId = null) {
    try {
      // Insert view record
      const { error } = await supabase
        .from('listing_views')
        .insert({
          listing_id: listingId,
          user_id: userId,
          viewed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update view count using RPC
      const { error: updateError } = await supabase.rpc('increment_listing_views', {
        listing_id: listingId
      });

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Track view error:', error);
      return { success: false, error: error.message };
    }
  }

  // Track contact
  async trackContact(listingId, userId = null) {
    try {
      const { error } = await supabase
        .from('listing_contacts')
        .insert({
          listing_id: listingId,
          user_id: userId,
          contacted_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update contact count
      const { error: updateError } = await supabase.rpc('increment_listing_contacts', {
        listing_id: listingId
      });

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Track contact error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get listing stats
  async getListingStats(listingId) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('view_count, contact_count, title, category')
        .eq('id', listingId)
        .single();

      if (error) throw error;

      return {
        success: true,
        stats: data
      };
    } catch (error) {
      console.error('Get listing stats error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get business analytics
  async getBusinessAnalytics(businessId, days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get listing views
      const { data: views, error: viewsError } = await supabase
        .from('listing_views')
        .select('*')
        .eq('listing_id', businessId)
        .gte('viewed_at', cutoffDate.toISOString());

      if (viewsError) throw viewsError;

      // Get contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('listing_contacts')
        .select('*')
        .eq('listing_id', businessId)
        .gte('contacted_at', cutoffDate.toISOString());

      if (contactsError) throw contactsError;

      // Get listings with stats
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, view_count, contact_count, category, status, created_at')
        .eq('business_id', businessId);

      if (listingsError) throw listingsError;

      // Calculate trend (compare with previous period)
      const previousCutoff = new Date(cutoffDate);
      previousCutoff.setDate(previousCutoff.getDate() - days);

      const { data: previousViews } = await supabase
        .from('listing_views')
        .select('count')
        .eq('listing_id', businessId)
        .gte('viewed_at', previousCutoff.toISOString())
        .lt('viewed_at', cutoffDate.toISOString());

      const trend = previousViews && previousViews.length > 0 
        ? ((views?.length || 0) - previousViews.length) / previousViews.length * 100
        : 0;

      // Get top performing listing
      const topListing = listings && listings.length > 0
        ? listings.reduce((a, b) => (a.view_count > b.view_count ? a : b), listings[0])
        : null;

      return {
        success: true,
        analytics: {
          totalViews: views?.length || 0,
          totalContacts: contacts?.length || 0,
          listings: listings || [],
          topListing: topListing,
          trend: Math.round(trend),
          period: `${days} days`,
          viewsByDay: this.groupByDay(views, 'viewed_at'),
          contactsByDay: this.groupByDay(contacts, 'contacted_at'),
          categoryDistribution: this.getCategoryDistribution(listings)
        }
      };
    } catch (error) {
      console.error('Get business analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  // Group data by day
  groupByDay(data, dateField) {
    if (!data || data.length === 0) return [];
    
    const grouped = {};
    data.forEach(item => {
      const date = new Date(item[dateField]).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count
    }));
  }

  // Get category distribution
  getCategoryDistribution(listings) {
    if (!listings || listings.length === 0) return [];
    
    const distribution = {};
    listings.forEach(listing => {
      const category = listing.category || 'Uncategorized';
      distribution[category] = (distribution[category] || 0) + 1;
    });

    return Object.entries(distribution).map(([category, count]) => ({
      category,
      count
    }));
  }

  // Get popular listings globally
  async getPopularListings(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          businesses:business_id (
            business_name,
            category,
            rating
          )
        `)
        .eq('status', 'active')
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        listings: data
      };
    } catch (error) {
      console.error('Get popular listings error:', error);
      return { success: false, error: error.message };
    }
  }

  // Track user activity
  async trackUserActivity(userId, action, metadata = {}) {
    try {
      const { error } = await supabase
        .from('user_activity')
        .insert({
          user_id: userId,
          action: action,
          metadata: metadata,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Track activity error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user activity
  async getUserActivity(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        activities: data
      };
    } catch (error) {
      console.error('Get user activity error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AnalyticsService();