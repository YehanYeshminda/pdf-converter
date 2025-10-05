import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VisitorCounterService {
    private http = inject(HttpClient);
    baseUrl: string = 'https://api.counterapi.dev/v2';

    upCounter(): Observable<IRoot> {
        const url = `${this.baseUrl}/yydevcount/counteryy/up`;
        return this.http.get<IRoot>(url)
    }

    getCounter(): Observable<IRoot> {
        const url = `${this.baseUrl}/yydevcount/counteryy`;
        return this.http.get<IRoot>(url)
    }
}

export interface IRoot {
    code: string
    data: VisitorCountResponse
    message: string
}

export interface VisitorCountResponse {
    created_at: string
    description: string
    down_count: number
    id: number
    name: string
    slug: string
    team_id: number
    up_count: number
    updated_at: string
    user_id: number
    workspace_id: number
    workspace_slug: string
}
