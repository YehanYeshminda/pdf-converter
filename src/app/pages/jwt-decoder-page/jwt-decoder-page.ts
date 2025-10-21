import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';

interface DecodedJWT {
    header: any;
    payload: any;
    signature: string;
    isValid: boolean;
    isExpired: boolean;
    expirationDate?: Date;
    issuedAt?: Date;
}

@Component({
    selector: 'app-jwt-decoder-page',
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatTooltipModule,
        MatChipsModule,
        MatTabsModule
    ],
    templateUrl: './jwt-decoder-page.html',
    styleUrl: './jwt-decoder-page.scss'
})
export class JwtDecoderPage {
    jwtInput: string = '';
    decodedJWT: DecodedJWT | null = null;
    errorMessage: string = '';
    headerJson: string = '';
    payloadJson: string = '';

    decode(): void {
        this.errorMessage = '';
        this.decodedJWT = null;
        this.headerJson = '';
        this.payloadJson = '';

        if (!this.jwtInput.trim()) {
            return;
        }

        try {
            const parts = this.jwtInput.trim().split('.');

            if (parts.length !== 3) {
                this.errorMessage = 'Invalid JWT format. A valid JWT should have 3 parts separated by dots (header.payload.signature)';
                return;
            }

            const [headerB64, payloadB64, signature] = parts;

            const header = this.base64UrlDecode(headerB64);
            const headerObj = JSON.parse(header);

            const payload = this.base64UrlDecode(payloadB64);
            const payloadObj = JSON.parse(payload);

            this.headerJson = JSON.stringify(headerObj, null, 2);
            this.payloadJson = JSON.stringify(payloadObj, null, 2);

            let isExpired = false;
            let expirationDate: Date | undefined;
            let issuedAt: Date | undefined;

            if (payloadObj.exp) {
                expirationDate = new Date(payloadObj.exp * 1000);
                isExpired = expirationDate < new Date();
            }

            if (payloadObj.iat) {
                issuedAt = new Date(payloadObj.iat * 1000);
            }

            this.decodedJWT = {
                header: headerObj,
                payload: payloadObj,
                signature: signature,
                isValid: true,
                isExpired: isExpired,
                expirationDate: expirationDate,
                issuedAt: issuedAt
            };

        } catch (error) {
            this.errorMessage = `Error decoding JWT: ${error instanceof Error ? error.message : 'Invalid format'}`;
        }
    }

    private base64UrlDecode(str: string): string {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        if (pad) {
            if (pad === 1) {
                throw new Error('Invalid base64 string');
            }
            base64 += new Array(5 - pad).join('=');
        }

        try {
            return decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
        } catch (error) {
            throw new Error('Invalid base64 encoding');
        }
    }

    copyToClipboard(text: string): void {
        navigator.clipboard.writeText(text);
    }

    clear(): void {
        this.jwtInput = '';
        this.decodedJWT = null;
        this.errorMessage = '';
        this.headerJson = '';
        this.payloadJson = '';
    }

    loadSampleJWT(): void {
        this.jwtInput = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        this.decode();
    }

    formatTimestamp(date: Date): string {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    }

    getTimeRemaining(date: Date): string {
        const now = new Date();
        const diff = date.getTime() - now.getTime();

        if (diff < 0) {
            const absDiff = Math.abs(diff);
            const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) return `Expired ${days}d ${hours}h ago`;
            if (hours > 0) return `Expired ${hours}h ${minutes}m ago`;
            return `Expired ${minutes}m ago`;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h remaining`;
        if (hours > 0) return `${hours}h ${minutes}m remaining`;
        return `${minutes}m remaining`;
    }
}
