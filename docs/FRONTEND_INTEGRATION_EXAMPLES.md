# Frontend Integration Examples

This document provides practical React/TypeScript examples for integrating with the Smishing Detection backend API.

## Table of Contents
1. [API Client Setup](#api-client-setup)
2. [Authentication Hooks](#authentication-hooks)
3. [News Management Hooks](#news-management-hooks)
4. [React Components](#react-components)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## API Client Setup

### Basic API Client (JavaScript)
```javascript
// api/client.js
class APIClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Auth methods
  async login(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyEmail(data) {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // News methods
  async getNews(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/news${queryString ? `?${queryString}` : ''}`);
  }

  async getNewsById(id) {
    return this.request(`/api/news/${id}`);
  }

  async getCategories() {
    return this.request('/api/news/categories');
  }

  async getNewsStats() {
    return this.request('/api/news/stats');
  }
}

export const apiClient = new APIClient();
```

### TypeScript API Client
```typescript
// api/client.ts
import { 
  LoginRequest, 
  SignupRequest, 
  VerifyEmailRequest,
  AuthResponse,
  BasicResponse,
  NewsQueryParams,
  NewsResponse,
  SingleNewsResponse,
  CategoriesResponse,
  NewsStatsResponse,
  APIError
} from '../types/api-types';

class TypedAPIClient {
  constructor(private baseURL: string = 'http://localhost:3000') {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error: APIError = data;
        throw new Error(error.message || 'API request failed');
      }

      return data as T;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: SignupRequest): Promise<BasicResponse> {
    return this.request<BasicResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<BasicResponse> {
    return this.request<BasicResponse>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // News methods
  async getNews(params: NewsQueryParams = {}): Promise<NewsResponse> {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    
    return this.request<NewsResponse>(`/api/news${queryString ? `?${queryString}` : ''}`);
  }

  async getNewsById(id: string): Promise<SingleNewsResponse> {
    return this.request<SingleNewsResponse>(`/api/news/${id}`);
  }

  async getCategories(): Promise<CategoriesResponse> {
    return this.request<CategoriesResponse>('/api/news/categories');
  }

  async getNewsStats(): Promise<NewsStatsResponse> {
    return this.request<NewsStatsResponse>('/api/news/stats');
  }
}

export const apiClient = new TypedAPIClient();
```

## Authentication Hooks

### useAuth Hook
```typescript
// hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient } from '../api/client';
import { User, LoginRequest, SignupRequest, VerifyEmailRequest } from '../types/api-types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  verifyEmail: (data: VerifyEmailRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token on app start
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.login(credentials);
      
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      setUser(response.data.user);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiClient.signup(userData);
    } catch (error: any) {
      setError(error.message || 'Signup failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (data: VerifyEmailRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiClient.verifyEmail(data);
    } catch (error: any) {
      setError(error.message || 'Email verification failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    signup,
    verifyEmail,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## News Management Hooks

### useNews Hook
```typescript
// hooks/useNews.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { 
  NewsArticle, 
  NewsCategory, 
  PaginationMeta, 
  NewsQueryParams,
  NewsStats 
} from '../types/api-types';

interface UseNewsOptions {
  initialCategory?: NewsCategory;
  initialSearch?: string;
  pageSize?: number;
}

export const useNews = (options: UseNewsOptions = {}) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    category: options.initialCategory,
    search: options.initialSearch || '',
    page: 1,
    limit: options.pageSize || 20,
  });

  const fetchNews = useCallback(async (params: NewsQueryParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getNews({
        ...filters,
        ...params,
      });

      if (params.page === 1 || !params.page) {
        setArticles(response.data);
      } else {
        // Append for pagination
        setArticles(prev => [...prev, ...response.data]);
      }
      
      setPagination(response.pagination);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch news');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.getCategories();
      setCategories(response.data);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.getNewsStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, [fetchCategories, fetchStats]);

  const search = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  }, []);

  const filterByCategory = useCallback((category?: NewsCategory) => {
    setFilters(prev => ({ ...prev, category, page: 1 }));
  }, []);

  const loadMore = useCallback(async () => {
    if (pagination?.hasNextPage) {
      const nextPage = (pagination?.currentPage || 0) + 1;
      await fetchNews({ page: nextPage });
    }
  }, [pagination, fetchNews]);

  const refresh = useCallback(() => {
    fetchNews({ page: 1 });
  }, [fetchNews]);

  const clearFilters = useCallback(() => {
    setFilters({
      category: undefined,
      search: '',
      page: 1,
      limit: options.pageSize || 20,
    });
  }, [options.pageSize]);

  return {
    articles,
    pagination,
    categories,
    stats,
    isLoading,
    error,
    filters,
    fetchNews,
    search,
    filterByCategory,
    loadMore,
    refresh,
    clearFilters,
  };
};
```

## React Components

### Login Component
```typescript
// components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoginRequest } from '../types/api-types';

export const LoginForm: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(formData);
      // Navigate to dashboard or home page
    } catch (error) {
      // Error is handled by useAuth hook
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isLoading}
        className="submit-button"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

### News Article Card
```typescript
// components/NewsCard.tsx
import React from 'react';
import { NewsArticle } from '../types/api-types';

interface NewsCardProps {
  article: NewsArticle;
  onRead?: (article: NewsArticle) => void;
  showFullDescription?: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({ 
  article, 
  onRead, 
  showFullDescription = false 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'cybersecurity': 'bg-blue-100 text-blue-800',
      'data-breach': 'bg-red-100 text-red-800',
      'malware': 'bg-purple-100 text-purple-800',
      'phishing': 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <article className="news-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      {article.urlToImage && (
        <img
          src={article.urlToImage}
          alt={article.title}
          className="w-full h-48 object-cover rounded-md mb-4"
          loading="lazy"
        />
      )}

      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
          {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
        </span>
        <time className="text-sm text-gray-500">
          {formatDate(article.publishedAt)}
        </time>
      </div>

      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
        {article.title}
      </h3>

      {article.description && (
        <p className="text-gray-600 mb-4">
          {showFullDescription 
            ? article.description 
            : truncateText(article.description, 150)
          }
        </p>
      )}

      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          {article.source.name}
        </span>
        {article.author && (
          <span className="text-sm text-gray-500">
            By {article.author}
          </span>
        )}
      </div>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.slice(0, 5).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded text-center hover:bg-blue-700 transition-colors"
        >
          Read Full Article
        </a>
        {onRead && (
          <button
            onClick={() => onRead(article)}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
          >
            Read More
          </button>
        )}
      </div>
    </article>
  );
};
```

### News List Component
```typescript
// components/NewsList.tsx
import React from 'react';
import { NewsCard } from './NewsCard';
import { useNews } from '../hooks/useNews';

export const NewsList: React.FC = () => {
  const {
    articles,
    pagination,
    isLoading,
    error,
    loadMore,
    refresh,
  } = useNews();

  if (isLoading && articles.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading news...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="news-list">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <NewsCard
            key={article._id}
            article={article}
            onRead={(article) => console.log('Reading:', article.title)}
          />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No cybersecurity articles found.
        </div>
      )}

      {pagination?.hasNextPage && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More Articles'}
          </button>
        </div>
      )}
    </div>
  );
};
```

### Search and Filter Component
```typescript
// components/NewsFilters.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNews } from '../hooks/useNews';
import { NewsCategory } from '../types/api-types';

export const NewsFilters: React.FC = () => {
  const {
    categories,
    filters,
    search,
    filterByCategory,
    clearFilters,
  } = useNews();

  const [searchTerm, setSearchTerm] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      search(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, search]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value as NewsCategory | '';
    filterByCategory(category || undefined);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    clearFilters();
  };

  return (
    <div className="news-filters bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Articles
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search cybersecurity news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={filters.category || ''}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={handleClearFilters}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.category || filters.search) && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {filters.category && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              Category: {filters.category}
            </span>
          )}
          {filters.search && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              Search: "{filters.search}"
            </span>
          )}
        </div>
      )}
    </div>
  );
};
```

## Error Handling

### Error Boundary Component
```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            We encountered an error while loading this content.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Global Error Handler
```typescript
// utils/errorHandler.ts
import { APIError } from '../types/api-types';

export const handleAPIError = (error: any): string => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your internet connection.';
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

export const isAuthError = (error: any): boolean => {
  return error.message?.includes('Unauthorized') || 
         error.message?.includes('token') ||
         error.status === 401;
};
```

## Best Practices

### Performance Optimization
```typescript
// hooks/useInfiniteScroll.ts
import { useCallback, useEffect } from 'react';

export const useInfiniteScroll = (
  hasMore: boolean,
  isLoading: boolean,
  loadMore: () => void
) => {
  const handleScroll = useCallback(() => {
    if (
      hasMore && 
      !isLoading && 
      window.innerHeight + document.documentElement.scrollTop + 1000 >= 
      document.documentElement.offsetHeight
    ) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
};
```

### Local Storage Helper
```typescript
// utils/storage.ts
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
};
```

### App Setup Example
```typescript
// App.tsx
import React from 'react';
import { AuthProvider } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NewsList } from './components/NewsList';
import { NewsFilters } from './components/NewsFilters';
import { LoginForm } from './components/LoginForm';
import { useAuth } from './hooks/useAuth';

const Dashboard: React.FC = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-8">Cybersecurity News</h1>
    <NewsFilters />
    <NewsList />
  </div>
);

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <LoginForm />;
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
```

---

This comprehensive guide should help frontend developers integrate effectively with your cybersecurity news backend API. The examples demonstrate proper error handling, state management, and performance optimization patterns.