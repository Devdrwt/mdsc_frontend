import { apiRequest } from './api';

export type CatalogStatusFilter = 'all' | 'active' | 'inactive';
export interface StudentCatalogFilters {
  search?: string;
  status?: CatalogStatusFilter;
  onlyEnrolled?: boolean;
}

export interface StudentCatalogCategoryMetrics {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  enrolledCourses: number;
}

export interface StudentCatalogCategory {
  id: number;
  name: string;
  description: string;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  metrics: StudentCatalogCategoryMetrics;
  lastCourseUpdate: string | null;
  sampleThumbnail: string | null;
}

export interface StudentCatalogMeta {
  total: number;
  activeCount: number;
  enrolledCount: number;
  appliedFilters: {
    search: string;
    status: CatalogStatusFilter;
    onlyEnrolled: boolean;
  };
}

export interface StudentCatalogResponse {
  categories: StudentCatalogCategory[];
  meta: StudentCatalogMeta;
}

export class StudentCatalogService {
  static async getCategories(
    filters: StudentCatalogFilters = {}
  ): Promise<StudentCatalogResponse> {
    const params = new URLSearchParams();

    if (filters.search) {
      params.set('search', filters.search);
    }

    if (filters.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }

    if (filters.onlyEnrolled) {
      params.set('onlyEnrolled', String(filters.onlyEnrolled));
    }

    const queryString = params.toString();
    const response = await apiRequest(`/student/catalogs/categories${queryString ? `?${queryString}` : ''}`, {
      method: 'GET'
    });

    const data = response.data || {};

    return {
      categories: Array.isArray(data.categories) ? data.categories : [],
      meta: {
        total: data.meta?.total ?? 0,
        activeCount: data.meta?.activeCount ?? 0,
        enrolledCount: data.meta?.enrolledCount ?? 0,
        appliedFilters: {
          search: data.meta?.appliedFilters?.search ?? filters.search ?? '',
          status: data.meta?.appliedFilters?.status ?? filters.status ?? 'all',
          onlyEnrolled:
            data.meta?.appliedFilters?.onlyEnrolled ??
            Boolean(filters.onlyEnrolled)
        }
      }
    };
  }
}

export const studentCatalogService = StudentCatalogService;

export default StudentCatalogService;

