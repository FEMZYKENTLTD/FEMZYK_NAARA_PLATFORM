// src/lib/types/database.ts
// ============================================================================
// FEMZYK NÀÁRA PLATFORM — Core TypeScript Type Definitions
// These types define the shape of all data in the platform.
// Every table from the blueprint is represented here.
// ============================================================================

// ---- Enums ----

/** User roles in the ecosystem — determines module access and permissions */
export type UserRole = 'apprentice' | 'master' | 'freelancer' | 'employer' | 'admin';

/** Status of a skill verification */
export type SkillStatus = 'pending' | 'verified' | 'rejected';

/** How the skill was verified */
export type VerificationMethod = 'master' | 'peer' | 'customer';

/** Status of a gig listing */
export type GigStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

/** Status of a global gig */
export type GlobalGigStatus = 'open' | 'assigned' | 'completed';

/** Status of a petition */
export type PetitionStatus = 'open' | 'closed' | 'responded';

/** Status of a FreeCycle item */
export type FreeCycleStatus = 'available' | 'claimed' | 'collected';

/** Category of a FreeCycle item */
export type FreeCycleCategory = 'clothing' | 'books' | 'electronics' | 'furniture' | 'other';

/** Category of a course */
export type CourseCategory = 'trade' | 'soft_skill' | 'digital';

/** Type of reaction on a post */
export type ReactionType = 'like' | 'love' | 'insightful' | 'angry' | 'support';

/** Status of a direct message */
export type MessageStatus = 'sent' | 'delivered' | 'read';

/** Status of a bill */
export type BillStatus = 'paid' | 'pending';

/** Status of an asset */
export type AssetStatus = 'available' | 'in_use' | 'maintenance';

/** Type of scam */
export type ScamType = 'phone' | 'bank' | 'messaging' | 'other';

/** Module identifiers for activity tracking */
export type ModuleId =
  | 'skillforge'
  | 'forum'
  | 'microskill_labs'
  | 'opportunity'
  | 'global_gig'
  | 'petition_hub'
  | 'freecycle'
  | 'price_pulse'
  | 'bill_split'
  | 'asset_share'
  | 'scam_shield'
  | 'trust_layer'
  | 'analytics'
  | 'identity'
  | 'proof_portfolio';

/** Supported languages */
export type Language = 'en' | 'fr' | 'ha' | 'yo' | 'tw';

// ---- Core Tables ----

/** User profile — single source of truth for identity across the ecosystem */
export interface User {
  user_id: string;
  full_name: string;
  username: string;
  email: string | null;
  phone_number: string | null;
  role: UserRole;
  trust_score: number;
  profile_photo: string | null;
  registration_date: string;
  last_login: string | null;
  language: Language;
  is_verified: boolean;
  consent_flags: Record<string, boolean>;
  bio: string | null;
  is_synced: boolean;
  last_synced: string | null;
}

/** Activity log entry — tracks every action across all modules */
export interface ActivityLog {
  activity_id: string;
  user_id: string;
  module_id: ModuleId;
  action_type: string;
  action_details: Record<string, unknown>;
  timestamp: string;
  geo_location: { lat: number; lng: number } | null;
  is_synced: boolean;
}

// ---- SkillForge / ProofPortfolio ----

/** A trade category (e.g., Auto Mechanics, Tailoring) */
export interface Trade {
  trade_id: string;
  trade_name: string;
  description: string;
  icon: string | null;
  created_at: string;
}

/** A skill node within a trade skill tree */
export interface Skill {
  skill_id: string;
  trade_id: string;
  skill_name: string;
  level: number;
  description: string;
  created_at: string;
}

/** A user progress on a specific skill */
export interface ApprenticeSkill {
  apprentice_skill_id: string;
  user_id: string;
  skill_id: string;
  status: SkillStatus;
  proof_url: string | null;
  timestamp: string;
  verified_by: string | null;
  verification_method: VerificationMethod | null;
  trust_score_delta: number;
  is_synced: boolean;
  last_synced: string | null;
}

/** Auto-generated portfolio from verified skills */
export interface Portfolio {
  portfolio_id: string;
  user_id: string;
  generated_url: string | null;
  last_generated: string;
  skill_summary: Record<string, unknown>;
  trust_score: number;
}

// ---- Forum / Social Layer ----

/** A discussion thread */
export interface Thread {
  thread_id: string;
  created_by: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  author?: User;
  post_count?: number;
}

/** A post within a thread */
export interface Post {
  post_id: string;
  thread_id: string;
  user_id: string;
  content: string;
  media: { url: string; type: string }[] | null;
  created_at: string;
  updated_at: string;
  author?: User;
  comments?: Comment[];
  reactions?: Reaction[];
  reaction_count?: number;
}

/** A comment on a post */
export interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: User;
}

/** A reaction on a post */
export interface Reaction {
  reaction_id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

/** A direct message between users */
export interface Message {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media: { url: string; type: string }[] | null;
  status: MessageStatus;
  created_at: string;
}

// ---- MicroSkill Labs ----

/** A course in the learning system */
export interface Course {
  course_id: string;
  title: string;
  description: string;
  media_urls: { url: string; type: string }[];
  created_by: string;
  created_at: string;
  approved: boolean;
  category: CourseCategory;
  offline_pack: boolean;
  instructor?: User;
}

// ---- Opportunity Infrastructure ----

/** A local gig listing */
export interface Gig {
  gig_id: string;
  title: string;
  description: string;
  required_skill_ids: string[];
  location: { lat: number; lng: number } | null;
  posted_by: string;
  applied_users: string[];
  status: GigStatus;
  created_at: string;
  payment: number | null;
  currency: string;
  is_synced: boolean;
  last_synced: string | null;
  employer?: User;
}

/** An international gig listing */
export interface GlobalGig {
  global_gig_id: string;
  title: string;
  description: string;
  required_skills: string[];
  applicants: string[];
  platform_status: GlobalGigStatus;
  payment: number | null;
  country: string;
  created_at: string;
}

// ---- PetitionHub ----

/** A petition */
export interface Petition {
  petition_id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  target_authority: string;
  signatures: string[];
  signature_count: number;
  status: PetitionStatus;
  is_synced: boolean;
  last_synced: string | null;
  creator?: User;
}

// ---- FreeCycle ----

/** A free item listing */
export interface FreeCycleItem {
  item_id: string;
  title: string;
  description: string | null;
  category: FreeCycleCategory;
  photo_url: string | null;
  posted_by: string;
  location: { lat: number; lng: number } | null;
  status: FreeCycleStatus;
  claimed_by: string | null;
  created_at: string;
  is_synced: boolean;
  last_synced: string | null;
  poster?: User;
}

// ---- PricePulse ----

/** A price entry submitted by a user */
export interface PriceEntry {
  price_entry_id: string;
  user_id: string;
  product_name: string;
  price: number;
  location: { lat: number; lng: number } | null;
  timestamp: string;
  median_price: number | null;
  is_synced: boolean;
  last_synced: string | null;
}

// ---- BillSplit ----

/** A shared bill */
export interface Bill {
  bill_id: string;
  group_id: string;
  title: string;
  amount: number;
  paid_by: string;
  splits: Record<string, number>;
  due_date: string | null;
  status: BillStatus;
  created_at: string;
  is_synced: boolean;
  last_synced: string | null;
}

// ---- AssetShare ----

/** A shared asset */
export interface Asset {
  asset_id: string;
  name: string;
  description: string | null;
  owner_id: string;
  location: { lat: number; lng: number } | null;
  booking_schedule: { slot: string; booked_by: string }[];
  status: AssetStatus;
  created_at: string;
  is_synced: boolean;
  last_synced: string | null;
}

// ---- ScamShield ----

/** A scam report */
export interface ScamReport {
  report_id: string;
  user_id: string;
  scam_type: ScamType;
  scam_detail: string;
  reported_account: string;
  risk_score: number;
  timestamp: string;
  is_synced: boolean;
  last_synced: string | null;
}

// ---- TrustLayer ----

/** A trust record for a user */
export interface TrustRecord {
  trust_id: string;
  user_id: string;
  verified_skills: string[];
  verification_sources: { skill_id: string; method: VerificationMethod }[];
  trust_score: number;
  last_update: string;
}

// ---- Analytics Dashboard ----

/** A dashboard metric entry */
export interface DashboardMetric {
  dashboard_id: string;
  module_id: ModuleId;
  metric_type: string;
  metric_value: number;
  timestamp: string;
  region: string | null;
  additional_data: Record<string, unknown>;
}