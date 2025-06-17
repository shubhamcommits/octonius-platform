import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Workplace {
  uuid: string;
  name: string;
  logo_url?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkplaceService {
  private apiUrl = environment.apiUrl + '/workplaces';

  constructor(private http: HttpClient) { }

  // TODO: Replace mock with actual API call
  getWorkplaces(): Observable<Workplace[]> {
    return this.http.get<Workplace[]>(this.apiUrl);
  }

  selectWorkplace(workplaceId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${workplaceId}/select`, { user_id: userId });
  }

  createWorkplace(name: string): Observable<Workplace> {
    return this.http.post<Workplace>(this.apiUrl, { name });
  }

  getUserWorkplaces(user_id: string): Observable<Workplace[]> {
    return this.http.get<Workplace[]>(`${this.apiUrl}/users/${user_id}`)
  }
}
  