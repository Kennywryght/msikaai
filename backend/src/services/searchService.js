// backend/src/services/searchService.js
import { MeiliSearch } from 'meilisearch';
import { logger } from '../utils/logger.js';

class SearchService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.indexName = process.env.MEILISEARCH_INDEX || 'listings';
    
    const host = process.env.MEILISEARCH_HOST;
    const apiKey = process.env.MEILISEARCH_API_KEY;
    
    if (!host) {
      logger.info('ℹ️ MEILISEARCH_HOST not configured, using database search fallback');
      return;
    }

    try {
      this.client = new MeiliSearch({
        host: host,
        apiKey: apiKey || '',
      });
      
      this.isConnected = true;
      logger.info('✅ Meilisearch client initialized');
      this.setupIndex();
    } catch (error) {
      this.isConnected = false;
      logger.warn('⚠️ Meilisearch initialization failed:', error.message);
    }
  }

  async setupIndex() {
    if (!this.isConnected || !this.client) return;

    try {
      // Get or create index
      const index = this.client.index(this.indexName);
      
      // Configure searchable attributes
      await index.updateSettings({
        searchableAttributes: [
          'title',
          'description',
          'category',
          'subCategory',
          'businessName',
          'locationArea',
          'tags',
        ],
        filterableAttributes: [
          'category',
          'subCategory',
          'price',
          'locationArea',
          'deliveryAvailable',
          'businessId',
          'status',
        ],
        sortableAttributes: [
          'price',
          'createdAt',
          'viewCount',
          'rating',
        ],
        rankingRules: [
          'words',
          'typo',
          'proximity',
          'attribute',
          'sort',
          'exactness',
        ],
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: {
            oneTypo: 3,
            twoTypos: 7,
          },
          disableOnAttributes: [],
        },
        pagination: {
          maxTotalHits: 10000,
        },
        synonyms: {
          'farm': ['agriculture', 'farming', 'agricultural'],
          'produce': ['crops', 'harvest', 'yield'],
          'maize': ['corn', 'mealie'],
          'chicken': ['fowl', 'poultry'],
          'goat': ['mbuzi', 'goats'],
          'cow': ['ngombe', 'cattle', 'beef'],
          'shop': ['store', 'market', 'outlet'],
          'service': ['repair', 'maintenance', 'fix'],
          'plumber': ['piping', 'water pipes', 'plumbing'],
          'electrician': ['wiring', 'electrical', 'power'],
        },
      });

      logger.info('✅ Meilisearch index configured:', this.indexName);
    } catch (error) {
      logger.error('❌ Meilisearch index setup error:', error.message);
    }
  }

  // ============================================
  // INDEXING METHODS
  // ============================================

  async indexListing(listing) {
    if (!this.isConnected || !this.client) return false;

    try {
      const index = this.client.index(this.indexName);
      
      // Prepare document for indexing
      const document = {
        id: listing.id,
        title: listing.title,
        description: listing.description || '',
        category: listing.category || 'Other',
        subCategory: listing.subCategory || '',
        price: listing.price ? parseFloat(listing.price) : null,
        locationArea: listing.locationArea || '',
        deliveryAvailable: listing.deliveryAvailable || false,
        businessId: listing.businessId,
        businessName: listing.business?.businessName || '',
        status: listing.status || 'active',
        images: listing.images || [],
        viewCount: listing.viewCount || 0,
        contactCount: listing.contactCount || 0,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt || new Date().toISOString(),
        tags: this.generateTags(listing),
      };

      await index.addDocuments([document]);
      logger.debug(`📄 Indexed listing: ${listing.id}`);
      return true;
    } catch (error) {
      logger.error('❌ Index listing error:', error.message);
      return false;
    }
  }

  async indexListings(listings) {
    if (!this.isConnected || !this.client || !listings.length) return 0;

    try {
      const index = this.client.index(this.indexName);
      
      const documents = listings.map(listing => ({
        id: listing.id,
        title: listing.title,
        description: listing.description || '',
        category: listing.category || 'Other',
        subCategory: listing.subCategory || '',
        price: listing.price ? parseFloat(listing.price) : null,
        locationArea: listing.locationArea || '',
        deliveryAvailable: listing.deliveryAvailable || false,
        businessId: listing.businessId,
        businessName: listing.business?.businessName || '',
        status: listing.status || 'active',
        images: listing.images || [],
        viewCount: listing.viewCount || 0,
        contactCount: listing.contactCount || 0,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt || new Date().toISOString(),
        tags: this.generateTags(listing),
      }));

      await index.addDocuments(documents);
      logger.info(`📄 Indexed ${documents.length} listings`);
      return documents.length;
    } catch (error) {
      logger.error('❌ Index listings error:', error.message);
      return 0;
    }
  }

  async updateListing(listing) {
    return this.indexListing(listing);
  }

  async deleteListing(id) {
    if (!this.isConnected || !this.client) return false;

    try {
      const index = this.client.index(this.indexName);
      await index.deleteDocument(id);
      logger.debug(`🗑️ Deleted listing from search: ${id}`);
      return true;
    } catch (error) {
      logger.error('❌ Delete listing error:', error.message);
      return false;
    }
  }

  async deleteListings(ids) {
    if (!this.isConnected || !this.client || !ids.length) return 0;

    try {
      const index = this.client.index(this.indexName);
      await index.deleteDocuments(ids);
      logger.info(`🗑️ Deleted ${ids.length} listings from search`);
      return ids.length;
    } catch (error) {
      logger.error('❌ Delete listings error:', error.message);
      return 0;
    }
  }

  async clearIndex() {
    if (!this.isConnected || !this.client) return false;

    try {
      const index = this.client.index(this.indexName);
      await index.deleteAllDocuments();
      logger.info('🗑️ Search index cleared');
      return true;
    } catch (error) {
      logger.error('❌ Clear index error:', error.message);
      return false;
    }
  }

  // ============================================
  // SEARCH METHODS
  // ============================================

  async search(query, options = {}) {
    if (!this.isConnected || !this.client) {
      return { hits: [], total: 0, facets: {} };
    }

    try {
      const index = this.client.index(this.indexName);
      
      const searchParams = {
        limit: options.limit || 20,
        offset: options.offset || 0,
        filter: [],
        sort: [],
        facets: options.facets ? ['category', 'locationArea', 'price'] : [],
        attributesToRetrieve: options.attributesToRetrieve || [
          'id', 'title', 'description', 'category', 'subCategory',
          'price', 'locationArea', 'deliveryAvailable', 'businessId',
          'businessName', 'images', 'viewCount', 'createdAt'
        ],
        attributesToHighlight: ['title', 'description'],
        highlightPreTag: '<em>',
        highlightPostTag: '</em>',
        showRankingScore: options.showRankingScore || false,
      };

      // Build filters
      if (options.category) {
        searchParams.filter.push(`category = "${options.category}"`);
      }

      if (options.subCategory) {
        searchParams.filter.push(`subCategory = "${options.subCategory}"`);
      }

      if (options.location) {
        searchParams.filter.push(`locationArea = "${options.location}"`);
      }

      if (options.businessId) {
        searchParams.filter.push(`businessId = "${options.businessId}"`);
      }

      if (options.status) {
        searchParams.filter.push(`status = "${options.status}"`);
      }

      if (options.minPrice !== undefined && options.minPrice !== null) {
        searchParams.filter.push(`price >= ${options.minPrice}`);
      }

      if (options.maxPrice !== undefined && options.maxPrice !== null) {
        searchParams.filter.push(`price <= ${options.maxPrice}`);
      }

      if (options.deliveryAvailable !== undefined) {
        searchParams.filter.push(`deliveryAvailable = ${options.deliveryAvailable}`);
      }

      // Build sort
      if (options.sortBy) {
        const sortMap = {
          'price_asc': ['price:asc'],
          'price_desc': ['price:desc'],
          'newest': ['createdAt:desc'],
          'oldest': ['createdAt:asc'],
          'popular': ['viewCount:desc'],
          'relevance': [], // Default
        };
        searchParams.sort = sortMap[options.sortBy] || [];
      }

      // Perform search
      const results = await index.search(query || '', searchParams);

      return {
        hits: results.hits || [],
        total: results.estimatedTotalHits || 0,
        facets: results.facetDistribution || {},
        query: results.query || query,
        processingTimeMs: results.processingTimeMs || 0,
      };
    } catch (error) {
      logger.error('❌ Search error:', error.message);
      return { hits: [], total: 0, facets: {} };
    }
  }

  // ============================================
  // FACET SEARCH
  // ============================================

  async getFacets(facetName, query = '', options = {}) {
    if (!this.isConnected || !this.client) return [];

    try {
      const index = this.client.index(this.indexName);
      
      const results = await index.search(query || '', {
        facets: [facetName],
        limit: 0,
        ...options,
      });

      return results.facetDistribution?.[facetName] || {};
    } catch (error) {
      logger.error('❌ Get facets error:', error.message);
      return {};
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  generateTags(listing) {
    const tags = [];
    
    if (listing.category) tags.push(listing.category.toLowerCase());
    if (listing.subCategory) tags.push(listing.subCategory.toLowerCase());
    if (listing.locationArea) tags.push(listing.locationArea.toLowerCase());
    
    // Extract keywords from title
    if (listing.title) {
      const words = listing.title.split(' ').filter(w => w.length > 3);
      tags.push(...words.map(w => w.toLowerCase()));
    }
    
    return [...new Set(tags)].slice(0, 20); // Unique tags, max 20
  }

  async getStats() {
    if (!this.isConnected || !this.client) {
      return { connected: false };
    }

    try {
      const index = this.client.index(this.indexName);
      const stats = await index.getStats();
      return {
        connected: true,
        documentsCount: stats.numberOfDocuments,
        fields: stats.fields || [],
        indexName: this.indexName,
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  async getIndexSettings() {
    if (!this.isConnected || !this.client) return null;

    try {
      const index = this.client.index(this.indexName);
      return await index.getSettings();
    } catch (error) {
      logger.error('❌ Get settings error:', error.message);
      return null;
    }
  }
}

// Create singleton instance
const searchService = new SearchService();

export default searchService;