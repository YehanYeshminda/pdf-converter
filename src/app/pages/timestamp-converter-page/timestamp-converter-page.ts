import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
    selector: 'app-timestamp-converter-page',
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
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatTabsModule
    ],
    templateUrl: './timestamp-converter-page.html',
    styleUrl: './timestamp-converter-page.scss'
})
export class TimestampConverterPage implements OnInit {
    // Unix to Date
    unixTimestamp: number | null = null;
    unixUnit: 'seconds' | 'milliseconds' = 'seconds';
    convertedDate: Date | null = null;

    // Date to Unix
    selectedDate: Date = new Date();
    selectedTime: string = '';
    dateToUnixSeconds: number = 0;
    dateToUnixMilliseconds: number = 0;

    // Current timestamp
    currentTimestamp: number = 0;
    currentDate: Date = new Date();

    // Timezones
    timezones = [
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
        { value: 'America/New_York', label: 'EST/EDT (New York)' },
        { value: 'America/Chicago', label: 'CST/CDT (Chicago)' },
        { value: 'America/Denver', label: 'MST/MDT (Denver)' },
        { value: 'America/Los_Angeles', label: 'PST/PDT (Los Angeles)' },
        { value: 'Europe/London', label: 'GMT/BST (London)' },
        { value: 'Europe/Paris', label: 'CET/CEST (Paris)' },
        { value: 'Europe/Moscow', label: 'MSK (Moscow)' },
        { value: 'Asia/Dubai', label: 'GST (Dubai)' },
        { value: 'Asia/Kolkata', label: 'IST (India)' },
        { value: 'Asia/Shanghai', label: 'CST (China)' },
        { value: 'Asia/Tokyo', label: 'JST (Japan)' },
        { value: 'Australia/Sydney', label: 'AEDT/AEST (Sydney)' }
    ];

    selectedTimezone: string = 'UTC';
    timezoneDate: string = '';

    // Relative time
    targetDate: Date = new Date();
    relativeTime: string = '';

    ngOnInit(): void {
        this.updateCurrentTimestamp();
        this.initializeDateTime();
        // Update current timestamp every second
        setInterval(() => {
            this.updateCurrentTimestamp();
        }, 1000);
    }

    private initializeDateTime(): void {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        this.selectedTime = `${hours}:${minutes}`;
        this.convertDateToUnix();
    }

    private updateCurrentTimestamp(): void {
        this.currentTimestamp = Math.floor(Date.now() / 1000);
        this.currentDate = new Date();
    }

    convertUnixToDate(): void {
        if (this.unixTimestamp === null) {
            this.convertedDate = null;
            return;
        }

        try {
            const timestamp = this.unixUnit === 'seconds'
                ? this.unixTimestamp * 1000
                : this.unixTimestamp;

            this.convertedDate = new Date(timestamp);

            if (isNaN(this.convertedDate.getTime())) {
                this.convertedDate = null;
            }
        } catch (error) {
            this.convertedDate = null;
        }
    }

    convertDateToUnix(): void {
        if (!this.selectedDate) {
            return;
        }

        try {
            const date = new Date(this.selectedDate);

            if (this.selectedTime) {
                const [hours, minutes] = this.selectedTime.split(':').map(Number);
                date.setHours(hours, minutes, 0, 0);
            }

            this.dateToUnixSeconds = Math.floor(date.getTime() / 1000);
            this.dateToUnixMilliseconds = date.getTime();
        } catch (error) {
            this.dateToUnixSeconds = 0;
            this.dateToUnixMilliseconds = 0;
        }
    }

    useCurrentTimestamp(): void {
        this.unixTimestamp = this.currentTimestamp;
        this.unixUnit = 'seconds';
        this.convertUnixToDate();
    }

    copyToClipboard(text: string | number): void {
        navigator.clipboard.writeText(text.toString());
    }

    formatDate(date: Date): string {
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    }

    formatISODate(date: Date): string {
        return date.toISOString();
    }

    formatUTCDate(date: Date): string {
        return date.toUTCString();
    }

    convertToTimezone(): void {
        if (!this.convertedDate) {
            this.timezoneDate = '';
            return;
        }

        try {
            this.timezoneDate = this.convertedDate.toLocaleString('en-US', {
                timeZone: this.selectedTimezone,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'long'
            });
        } catch (error) {
            this.timezoneDate = 'Invalid timezone';
        }
    }

    calculateRelativeTime(): void {
        if (!this.targetDate) {
            this.relativeTime = '';
            return;
        }

        const now = new Date();
        const target = new Date(this.targetDate);
        const diffMs = target.getTime() - now.getTime();
        const absDiffMs = Math.abs(diffMs);

        const seconds = Math.floor(absDiffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30.44);
        const years = Math.floor(days / 365.25);

        const isPast = diffMs < 0;
        const suffix = isPast ? 'ago' : 'from now';

        if (years > 0) {
            const remainingMonths = Math.floor((days % 365.25) / 30.44);
            this.relativeTime = `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''} ${suffix}`;
        } else if (months > 0) {
            const remainingDays = Math.floor(days % 30.44);
            this.relativeTime = `${months} month${months > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''} ${suffix}`;
        } else if (weeks > 0) {
            const remainingDays = days % 7;
            this.relativeTime = `${weeks} week${weeks > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''} ${suffix}`;
        } else if (days > 0) {
            const remainingHours = hours % 24;
            this.relativeTime = `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours} hour${remainingHours > 1 ? 's' : ''}` : ''} ${suffix}`;
        } else if (hours > 0) {
            const remainingMinutes = minutes % 60;
            this.relativeTime = `${hours} hour${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}` : ''} ${suffix}`;
        } else if (minutes > 0) {
            const remainingSeconds = seconds % 60;
            this.relativeTime = `${minutes} minute${minutes > 1 ? 's' : ''}${remainingSeconds > 0 ? ` ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}` : ''} ${suffix}`;
        } else {
            this.relativeTime = `${seconds} second${seconds !== 1 ? 's' : ''} ${suffix}`;
        }

        // Add exact difference
        this.relativeTime += `\n\nExact difference:\n${days} days, ${hours % 24} hours, ${minutes % 60} minutes, ${seconds % 60} seconds`;
    }

    clear(): void {
        this.unixTimestamp = null;
        this.convertedDate = null;
        this.selectedDate = new Date();
        this.initializeDateTime();
        this.timezoneDate = '';
        this.relativeTime = '';
    }
}
