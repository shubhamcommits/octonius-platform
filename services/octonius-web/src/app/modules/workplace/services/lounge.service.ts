import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LoungeStory {
  uuid: string;
  title: string;
  description: string;
  type: 'news' | 'event' | 'update';
  date: string;
  image?: string;
  user_id: string;
  event_date?: string;
  location?: string;
  attendees?: string[];
  created_at: string;
  updated_at: string;
  // Frontend-specific fields for UI
  highlight?: boolean;
  event?: boolean;
  time?: string;
  eventAttending?: number;
  eventStatus?: string;
}

@Injectable({ providedIn: 'root' })
export class LoungeService {
  private apiUrl = `${environment.apiUrl}/lounges`;

  constructor(private http: HttpClient) {}

  getStories(): Observable<{ stories: LoungeStory[] }> {
    return this.http.get<{ stories: LoungeStory[] }>(`${this.apiUrl}`);
  }

  getStory(uuid: string): Observable<{ story: LoungeStory }> {
    return this.http.get<{ story: LoungeStory }>(`${this.apiUrl}/${uuid}`);
  }

  createStory(data: Partial<LoungeStory>): Observable<{ story: LoungeStory }> {
    return this.http.post<{ story: LoungeStory }>(`${this.apiUrl}`, data);
  }

  updateStory(uuid: string, data: Partial<LoungeStory>): Observable<{ story: LoungeStory }> {
    return this.http.put<{ story: LoungeStory }>(`${this.apiUrl}/${uuid}`, data);
  }

  deleteStory(uuid: string): Observable<{ story: LoungeStory }> {
    return this.http.delete<{ story: LoungeStory }>(`${this.apiUrl}/${uuid}`);
  }
} 