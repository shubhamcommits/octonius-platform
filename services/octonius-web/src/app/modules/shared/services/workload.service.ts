import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PaginatedTasks {
  tasks: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class WorkloadService {
  private apiUrl = environment.apiUrl + '/workload';

  constructor(private http: HttpClient) {}

  // Get workload/tasks for the current user (optionally by workplace)
  getWorkload(userId: string, workplaceId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?user_id=${userId}&workplace_id=${workplaceId}`);
  }

  // Get paginated tasks for a specific section
  getPaginatedTasks(
    userId: string, 
    workplaceId: string, 
    section: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek',
    page: number = 1,
    limit: number = 5
  ): Observable<any> {
    const params = new HttpParams()
      .set('user_id', userId)
      .set('workplace_id', workplaceId)
      .set('section', section)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/paginated`, { params });
  }
} 