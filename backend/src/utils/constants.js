// backend/src/utils/constants.js

// ============================================
// TRUST TIERS
// ============================================
export const TRUST_TIERS = {
  0: {
    name: 'Unverified',
    description: 'Anonymous browsing only',
    escrowLimit: 20000,
    requirements: [],
  },
  1: {
    name: 'Phone Verified',
    description: 'Phone number confirmed',
    escrowLimit: 50000,
    requirements: ['phone'],
  },
  2: {
    name: 'ID Verified',
    description: 'Government ID confirmed',
    escrowLimit: 200000,
    requirements: ['phone', 'id'],
  },
  3: {
    name: 'Business Verified',
    description: 'Registered business confirmed',
    escrowLimit: 1000000,
    requirements: ['phone', 'id', 'business'],
  },
};

// ============================================
// TRUST SCORE WEIGHTS
// ============================================
export const TRUST_SCORE_WEIGHTS = {
  BASE: 30,
  VOLUME_PER_LISTING: 2,
  VOLUME_PER_RESPONSE: 1,
  VOLUME_PER_PREMIUM: 3,
  VOLUME_PER_FULFILLED_REQUEST: 2,
  VOLUME_PER_DELIVERY: 2,
  VOLUME_CAP: 30,
  RATING_MAX: 25,
  RATING_MIN_REVIEWS: 3,
  VERIFICATION_BONUS: {
    email: 3,
    phone: 5,
    id: 5,
    business: 2,
  },
  REPORT_PENALTY_PER_UPHELD: 10,
  SUSPENSION_PENALTY: 100,
};

// ============================================
// VERIFICATION TYPES
// ============================================
export const VERIFICATION_TYPES = {
  EMAIL: 'email',
  PHONE: 'phone',
  ID: 'id',
  BUSINESS: 'business',
};

export const VERIFICATION_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

// ============================================
// REQUEST STATUSES
// ============================================
export const REQUEST_STATUSES = {
  OPEN: 'open',
  ANSWERED: 'answered',
  FULFILLED: 'fulfilled',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

export const REQUEST_RESPONSE_STATUSES = {
  PENDING: 'pending',
  NEGOTIATING: 'negotiating',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
};

export const PROPOSAL_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  SUPERSEDED: 'superseded',
  WITHDRAWN: 'withdrawn',
};

export const PROPOSAL_KINDS = {
  INITIAL: 'initial',
  COUNTER: 'counter',
};

// ============================================
// DELIVERY
// ★ PHASE 3: added PENDING_APPROVAL
// ============================================
export const DELIVERY_STATUSES = {
  OPEN: 'open',
  PENDING_APPROVAL: 'pending_approval',
  ACCEPTED: 'accepted',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

export const DELIVERY_ACTIVE_STATUSES = [
  'open',
  'pending_approval',
  'accepted',
  'picked_up',
  'delivered',
];

// ★ PHASE 3: courier request states
export const COURIER_REQUEST_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  AUTO_REJECTED: 'auto_rejected',
};

// ★ PHASE 3: per-side approval states
export const DELIVERY_APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const PACKAGE_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  BULKY: 'bulky',
};

export const PACKAGE_SIZE_LABELS = {
  small: 'Small (envelope, documents)',
  medium: 'Medium (shoebox)',
  large: 'Large (carry-on bag)',
  bulky: 'Bulky (furniture, multiple bags)',
};

export const DELIVERY_EXPIRY_HOURS = 48;
export const MAX_DELIVERY_TITLE_LENGTH = 120;
export const MAX_DELIVERY_DESC_LENGTH = 1000;
export const MAX_ACTIVE_DELIVERIES_PER_COURIER = 5;

// ============================================
// TIER RESOLUTION
// ============================================
export const resolveTier = ({ phoneVerified, idVerified, businessVerified }) => {
  if (businessVerified && idVerified && phoneVerified) return 3;
  if (idVerified && phoneVerified) return 2;
  if (phoneVerified) return 1;
  return 0;
};

export default {
  TRUST_TIERS,
  TRUST_SCORE_WEIGHTS,
  VERIFICATION_TYPES,
  VERIFICATION_STATUSES,
  REQUEST_STATUSES,
  REQUEST_RESPONSE_STATUSES,
  PROPOSAL_STATUSES,
  PROPOSAL_KINDS,
  DELIVERY_STATUSES,
  DELIVERY_ACTIVE_STATUSES,
  COURIER_REQUEST_STATUSES,
  DELIVERY_APPROVAL_STATUSES,
  PACKAGE_SIZES,
  PACKAGE_SIZE_LABELS,
  DELIVERY_EXPIRY_HOURS,
  MAX_DELIVERY_TITLE_LENGTH,
  MAX_DELIVERY_DESC_LENGTH,
  MAX_ACTIVE_DELIVERIES_PER_COURIER,
  resolveTier,
};