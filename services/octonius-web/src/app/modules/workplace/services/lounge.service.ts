import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LoungeStory {
  id: string;
  title: string;
  description: string;
  type: 'news' | 'event' | 'update';
  date: string;
  image?: string;
  authorId: string;
  eventDate?: string;
  eventLocation?: string;
  eventAttending?: number;
  eventStatus?: string;
  highlight?: boolean;
  event?: boolean;
  time?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LoungeService {
  private apiUrl = `${environment.apiUrl}/lounges`;

  constructor(private http: HttpClient) {}

  getStories(): Observable<{ stories: LoungeStory[] }> {
    return this.http.get<{ stories: LoungeStory[] }>(`${this.apiUrl}`);
  }

  getStory(id: string): Observable<{ story: LoungeStory }> {
    return this.http.get<{ story: LoungeStory }>(`${this.apiUrl}/${id}`);
  }

  createStory(data: Partial<LoungeStory>): Observable<{ story: LoungeStory }> {
    return this.http.post<{ story: LoungeStory }>(`${this.apiUrl}`, data);
  }

  updateStory(id: string, data: Partial<LoungeStory>): Observable<{ story: LoungeStory }> {
    return this.http.put<{ story: LoungeStory }>(`${this.apiUrl}/${id}`, data);
  }

  deleteStory(id: string): Observable<{ story: LoungeStory }> {
    return this.http.delete<{ story: LoungeStory }>(`${this.apiUrl}/${id}`);
  }
} 