import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkloadService {
  private apiUrl = environment.apiUrl + '/workload';

  constructor(private http: HttpClient) {}

  // Get workload/tasks for the current user (optionally by workplace)
  getWorkload(userId: string, workplaceId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?user_id=${userId}&workplace_id=${workplaceId}`);
  }
} 