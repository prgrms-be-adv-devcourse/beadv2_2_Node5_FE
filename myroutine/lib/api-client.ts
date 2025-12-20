const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export interface ExceptionResponse {
  code: string
  message: string
  status?: number
}

export interface PageInfoDto {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PageResponse<T> {
  content: T[]
  pageable: any
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: any
  first: boolean
  numberOfElements: number
  empty: boolean
}

// Endpoints that are publicly accessible without auth (no redirect on 401)
const PUBLIC_GET_ENDPOINTS: ((path: string) => boolean)[] = [
  (path) => path === "/catalog-service/api/v1/search",
  (path) => path === "/catalog-service/api/v1/products",
  (path) => /^\/catalog-service\/api\/v1\/products\/[^/]+$/.test(path),
]

class ApiClient {
  private baseUrl: string
  private accessToken: string | null = null
  private isRefreshing = false

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  clearAccessToken() {
    this.accessToken = null
  }

  private getStoredToken(key: string) {
    if (typeof window === "undefined") return null
    return localStorage.getItem(key)
  }

  private setStoredToken(key: string, value: string) {
    if (typeof window === "undefined") return
    localStorage.setItem(key, value)
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) return null
    if (typeof window === "undefined") return null
    const refreshToken = this.getStoredToken("refreshToken")
    if (!refreshToken) return null

    this.isRefreshing = true
    try {
      const response = await fetch(
        `${this.baseUrl}/member-service/api/v1/auth/refresh-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        }
      )

      const text = await response.text()
      const data = text ? JSON.parse(text) : null

      if (!response.ok || !data?.accessToken) {
        return null
      }

      this.setAccessToken(data.accessToken)
      this.setStoredToken("accessToken", data.accessToken)
      if (data.refreshToken) {
        this.setStoredToken("refreshToken", data.refreshToken)
      }

      return data.accessToken
    } catch (err) {
      console.error(err)
      return null
    } finally {
      this.isRefreshing = false
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options?: {
      body?: any
      params?: Record<string, any>
      headers?: Record<string, string>
    }
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)

    // Add query parameters
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const doRequest = async (token?: string) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      }

      if (token && !headers.Authorization) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : null

      return { response, data }
    }

    let token =
      this.accessToken || this.getStoredToken("accessToken") || undefined
    let hasRetried = false

    while (true) {
      const { response, data } = await doRequest(token)

      if (response.ok) {
        return data as T
      }

      const isPublicGet =
        method === "GET" &&
        PUBLIC_GET_ENDPOINTS.some((matcher) => matcher(endpoint))

      if (response.status === 401 && !hasRetried) {
        const newToken = await this.refreshAccessToken()
        hasRetried = true
        if (newToken) {
          token = newToken
          continue
        }
        if (!isPublicGet) {
          this.handleUnauthorized()
        }
      }

      throw {
        code: data?.code || "UNKNOWN_ERROR",
        message: data?.message || "An error occurred",
        status: response.status,
      } as ExceptionResponse
    }
  }

  private handleUnauthorized() {
    if (typeof window === "undefined") return
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    // Redirect to login when no valid token/refresh is available
    if (window.location.pathname !== "/login") {
      const redirect = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`
      )
      window.location.replace(`/login?redirect=${redirect}`)
    }
  }

  async get<T>(
    endpoint: string,
    options?: { params?: Record<string, any>; headers?: Record<string, string> }
  ): Promise<T> {
    return this.request<T>("GET", endpoint, options)
  }

  async post<T>(
    endpoint: string,
    body?: any,
    options?: { params?: Record<string, any>; headers?: Record<string, string> }
  ): Promise<T> {
    return this.request<T>("POST", endpoint, { body, ...options })
  }

  async put<T>(
    endpoint: string,
    body?: any,
    options?: { params?: Record<string, any>; headers?: Record<string, string> }
  ): Promise<T> {
    return this.request<T>("PUT", endpoint, { body, ...options })
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    options?: { params?: Record<string, any>; headers?: Record<string, string> }
  ): Promise<T> {
    return this.request<T>("PATCH", endpoint, { body, ...options })
  }

  async delete<T>(
    endpoint: string,
    options?: { params?: Record<string, any>; headers?: Record<string, string> }
  ): Promise<T> {
    return this.request<T>("DELETE", endpoint, options)
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const DAY_OF_WEEK_OPTIONS: {
  id: DayOfWeek
  key: string
  label: string
}[] = [
  { id: 1, key: "MON", label: "월" },
  { id: 2, key: "TUE", label: "화" },
  { id: 3, key: "WED", label: "수" },
  { id: 4, key: "THU", label: "목" },
  { id: 5, key: "FRI", label: "금" },
  { id: 6, key: "SAT", label: "토" },
  { id: 7, key: "SUN", label: "일" },
]

export const formatDaysOfWeek = (days: DayOfWeek[]) =>
  days
    .slice()
    .sort((a, b) => a - b)
    .map(
      (day) =>
        DAY_OF_WEEK_OPTIONS.find((opt) => opt.id === day)?.label ?? String(day)
    )
    .join(", ")
