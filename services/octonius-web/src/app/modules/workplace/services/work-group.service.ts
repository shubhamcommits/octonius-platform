import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface WorkGroup {
  uuid: string;
  name: string;
  imageUrl: string;
  memberCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class WorkGroupService {
  private apiUrl = `${environment.apiUrl}/workplace/groups`;

  // Mock data for now
  private mockGroups: WorkGroup[] = [
    { uuid: '1', name: 'Sales Department', imageUrl: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1', memberCount: 12 },
    { uuid: '2', name: 'Software Engineering', imageUrl: 'https://images.unsplash.com/photo-1517694712202-1428bc3cd4b5', memberCount: 25 },
    { uuid: '3', name: 'Tech Support', imageUrl: 'https://images.unsplash.com/photo-1558021211-6514f4939332', memberCount: 8 },
    { uuid: '4', name: 'Operations', imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643', memberCount: 15 },
    { uuid: '5', name: 'Production plant', imageUrl: 'https://images.unsplash.com/photo-1580983218943-91173663c434', memberCount: 42 },
    { uuid: '6', name: 'Managers', imageUrl: 'https://images.unsplash.com/photo-1521737852577-684820831023', memberCount: 7 },
    { uuid: '7', name: 'Customer Support', imageUrl: 'https://images.unsplash.com/photo-1553775282-20af8077976e', memberCount: 18 },
    { uuid: '8', name: 'Marketing Department', imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4', memberCount: 10 },
    { uuid: '9', name: 'CRM Department', imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f', memberCount: 5 },
    { uuid: '10', name: 'Board', imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7', memberCount: 3 },
  ];

  constructor(private http: HttpClient) { }

  getGroups(): Observable<WorkGroup[]> {
    // Return mock data for now, replace with actual API call later
    return of(this.mockGroups);
    // return this.http.get<WorkGroup[]>(this.apiUrl);
  }

  getGroup(id: string): Observable<WorkGroup | undefined> {
    // Return mock data for now
    const group = this.mockGroups.find(g => g.uuid === id);
    return of(group);
    // return this.http.get<WorkGroup>(`${this.apiUrl}/${id}`);
  }

  createGroup(group: Partial<WorkGroup>): Observable<WorkGroup> {
    // Mock implementation
    const newGroup: WorkGroup = {
      uuid: (this.mockGroups.length + 1).toString(),
      name: group.name || '',
      imageUrl: group.imageUrl || 'https://media.octonius.com/groups/default.jpeg',
      memberCount: 0,
      ...group
    };
    this.mockGroups.push(newGroup);
    return of(newGroup);
    // return this.http.post<WorkGroup>(this.apiUrl, group);
  }

  updateGroup(id: string, group: Partial<WorkGroup>): Observable<WorkGroup> {
    // Mock implementation
    const index = this.mockGroups.findIndex(g => g.uuid === id);
    if (index !== -1) {
      this.mockGroups[index] = { ...this.mockGroups[index], ...group };
      return of(this.mockGroups[index]);
    }
    throw new Error('Group not found');
    // return this.http.put<WorkGroup>(`${this.apiUrl}/${id}`, group);
  }

  deleteGroup(id: string): Observable<void> {
    // Mock implementation
    const index = this.mockGroups.findIndex(g => g.uuid === id);
    if (index !== -1) {
      this.mockGroups.splice(index, 1);
    }
    return of(undefined);
    // return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchGroups(searchTerm: string): Observable<WorkGroup[]> {
    const filtered = this.mockGroups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return of(filtered);
  }
} 