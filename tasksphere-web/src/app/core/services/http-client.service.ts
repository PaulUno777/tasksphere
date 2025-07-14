import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, throwError } from 'rxjs';
import { ApiError, ApiResponse, PaginatedResponse } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HttpClientService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * GET request with automatic response unwrapping
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns Promise with unwrapped data
   */
  async get<T>(endpoint: string, params?: any): Promise<T> {
    const httpParams = this.buildHttpParams(params);
    const options = { params: httpParams, headers: this.getHeaders() };

    return firstValueFrom(
      this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, options).pipe(
        map((response) => response.data as T),
        catchError(this.handleError)
      )
    );
  }

  /**
   * GET request with automatic response unwrapping
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns Promise with unwrapped data
   */
  async getPaginated<T>(
    endpoint: string,
    params?: any
  ): Promise<PaginatedResponse<T>> {
    const httpParams = this.buildHttpParams(params);
    const options = { params: httpParams, headers: this.getHeaders() };
    return firstValueFrom(
      this.http
        .get<ApiResponse<PaginatedResponse<T>>>(
          `${this.baseUrl}${endpoint}`,
          options
        )
        .pipe(
          map((response) => response.data as PaginatedResponse<T>),
          catchError(this.handleError)
        )
    );
  }

  /**
   * POST request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @returns Promise with response data
   */
  async post<T>(endpoint: string, body: any): Promise<T> {
    const options = { headers: this.getHeaders() };

    return firstValueFrom(
      this.http
        .post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, options)
        .pipe(
          map((response) => response.data as T),
          catchError(this.handleError)
        )
    );
  }

  /**
   * POST request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @returns Promise with response data
   */
  async put<T>(endpoint: string, body: any): Promise<T> {
    const options = { headers: this.getHeaders() };

    return firstValueFrom(
      this.http
        .put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, options)
        .pipe(
          map((response) => response.data as T),
          catchError(this.handleError)
        )
    );
  }

  /**
   * PATCH request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @returns Promise with response data
   */
  async patch<T>(endpoint: string, body: any): Promise<T> {
    const options = { headers: this.getHeaders() };

    return firstValueFrom(
      this.http
        .patch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, options)
        .pipe(
          map((response) => response.data as T),
          catchError(this.handleError)
        )
    );
  }

  /**
   * DELETE request
   * @param endpoint - API endpoint
   * @returns Promise with response data
   */
  async delete<T>(endpoint: string): Promise<T> {
    const options = { headers: this.getHeaders() };

    return firstValueFrom(
      this.http
        .delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, options)
        .pipe(
          map((response) => response.data as T),
          catchError(this.handleError)
        )
    );
  }

  /**
   * Build HTTP headers with auth token and language
   * @returns HttpHeaders instance
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(environment.storage.tokenKey);
    const language = localStorage.getItem(environment.storage.languageKey);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    // Add language header if available
    if (language) {
      headers = headers.set('Accept-Language', language);
    }
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private buildHttpParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach((item) => {
              httpParams = httpParams.append(key, item.toString());
            });
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return httpParams;
  }

  private handleError = (error: any): Observable<never> => {
    console.error('HTTP Error:', error);

    if (error.error?.error) {
      return throwError(() => error.error.error);
    }

    const apiError: ApiError = {
      code: error.status?.toString() || 'UNKNOWN_ERROR',
      message:
        error.error?.message || error.message || 'An unexpected error occurred',
    };

    return throwError(() => apiError);
  };
}
