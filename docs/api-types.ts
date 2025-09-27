// TypeScript Type Definitions for Smishing Detection Backend API
// Use these types for type-safe frontend development

// ================================
// Authentication Types
// ================================

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface BasicResponse {
  success: boolean;
  message: string;
  data?: any;
}

// ================================
// News Types
// ================================

export interface NewsSource {
  name: string;
  id: string | null;
}

export interface NewsArticle {
  _id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string; // ISO date string
  source: NewsSource;
  author: string | null;
  category: NewsCategory;
  tags: string[];
  isActive: boolean;
  fetchedAt?: string; // ISO date string
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

export type NewsCategory = 'cybersecurity' | 'data-breach' | 'malware' | 'phishing';

export type SortOrder = 'asc' | 'desc';

export type SortBy = 'publishedAt' | 'title' | 'createdAt' | 'updatedAt';

// ================================
// API Request Parameters
// ================================

export interface NewsQueryParams {
  category?: NewsCategory;
  limit?: number; // Max 100
  page?: number;  // Starts from 1
  search?: string;
  tags?: string; // Comma-separated
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

// ================================
// API Response Types
// ================================

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalArticles: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface NewsResponse {
  success: boolean;
  data: NewsArticle[];
  pagination: PaginationMeta;
  message: string;
}

export interface SingleNewsResponse {
  success: boolean;
  data: NewsArticle;
  message: string;
}

export interface CategoryStats {
  [key: string]: number;
}

export interface SourceStats {
  [key: string]: number;
}

export interface NewsStats {
  totalArticles: number;
  categoryCounts: CategoryStats;
  sourceCounts: SourceStats;
  lastFetchedAt: string; // ISO date string
  articlesThisWeek: number;
  articlesToday: number;
}

export interface NewsStatsResponse {
  success: boolean;
  data: NewsStats;
  message: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: NewsCategory[];
  message: string;
}

export interface FetchResult {
  totalFetched: number;
  totalStored: number;
  duplicatesSkipped: number;
  irrelevantFiltered: number;
  sources: {
    [key: string]: number;
  };
}

export interface ManualFetchResponse {
  success: boolean;
  data: FetchResult;
  message: string;
}

// ================================
// Error Types
// ================================

export interface APIError {
  success: false;
  message: string;
  error?: {
    code?: string;
    details?: string;
  };
}

// ================================
// Frontend State Management Types
// ================================

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface NewsState {
  articles: NewsArticle[];
  categories: NewsCategory[];
  stats: NewsStats | null;
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    category?: NewsCategory;
    search?: string;
    tags?: string[];
  };
}

// ================================
// API Client Types
// ================================

export interface APIClient {
  // Auth methods
  login(credentials: LoginRequest): Promise<AuthResponse>;
  signup(userData: SignupRequest): Promise<BasicResponse>;
  verifyEmail(data: VerifyEmailRequest): Promise<BasicResponse>;
  
  // News methods
  getNews(params?: NewsQueryParams): Promise<NewsResponse>;
  getNewsById(id: string): Promise<SingleNewsResponse>;
  getCategories(): Promise<CategoriesResponse>;
  getNewsStats(): Promise<NewsStatsResponse>;
  manualFetch(): Promise<ManualFetchResponse>; // Admin only
}

// ================================
// Component Props Types
// ================================

export interface NewsCardProps {
  article: NewsArticle;
  onRead?: (article: NewsArticle) => void;
  showFullDescription?: boolean;
}

export interface NewsList {
  articles: NewsArticle[];
  isLoading: boolean;
  pagination?: PaginationMeta;
  onLoadMore?: () => void;
  onRefresh?: () => void;
}

export interface NewsFiltersProps {
  categories: NewsCategory[];
  selectedCategory?: NewsCategory;
  searchTerm?: string;
  onCategoryChange: (category?: NewsCategory) => void;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
}

export interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
}

// ================================
// Hook Return Types
// ================================

export interface UseNewsReturn {
  articles: NewsArticle[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  search: (term: string) => void;
  filterByCategory: (category?: NewsCategory) => void;
  clearFilters: () => void;
}

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  signup: (userData: SignupRequest) => Promise<void>;
  verifyEmail: (data: VerifyEmailRequest) => Promise<void>;
}

// ================================
// Utility Types
// ================================

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: RequestStatus;
  error: string | null;
}

// ================================
// Configuration Types
// ================================

export interface APIConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// ================================
// Constants
// ================================

export const NEWS_CATEGORIES: readonly NewsCategory[] = [
  'cybersecurity',
  'data-breach', 
  'malware',
  'phishing'
] as const;

export const SORT_OPTIONS: readonly SortBy[] = [
  'publishedAt',
  'title',
  'createdAt',
  'updatedAt'
] as const;

export const SORT_ORDERS: readonly SortOrder[] = ['asc', 'desc'] as const;

// ================================
// Form Validation Types
// ================================

export interface ValidationRule<T> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
}

export interface FormValidation {
  [key: string]: ValidationRule<any>;
}

export interface FormErrors {
  [key: string]: string;
}

// ================================
// Export all types
// ================================

export default {
  // Authentication
  User,
  LoginRequest,
  SignupRequest,
  VerifyEmailRequest,
  AuthResponse,
  BasicResponse,
  
  // News
  NewsArticle,
  NewsCategory,
  NewsSource,
  NewsQueryParams,
  NewsResponse,
  SingleNewsResponse,
  NewsStats,
  NewsStatsResponse,
  CategoriesResponse,
  ManualFetchResponse,
  PaginationMeta,
  
  // State Management
  AuthState,
  NewsState,
  
  // Components
  NewsCardProps,
  NewsList,
  NewsFiltersProps,
  PaginationProps,
  
  // Hooks
  UseNewsReturn,
  UseAuthReturn,
  
  // Utilities
  RequestStatus,
  AsyncState,
  APIConfig,
  APIError,
  
  // Validation
  FormValidation,
  FormErrors,
  ValidationRule
};