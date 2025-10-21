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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';

interface RegexMatch {
    match: string;
    index: number;
    groups: string[];
}

interface RegexPattern {
    name: string;
    pattern: string;
    description: string;
    flags?: string;
}

@Component({
    selector: 'app-regex-tester-page',
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
        MatCheckboxModule,
        MatChipsModule,
        MatExpansionModule
    ],
    templateUrl: './regex-tester-page.html',
    styleUrl: './regex-tester-page.scss'
})
export class RegexTesterPage {
    regexPattern: string = '';
    testString: string = '';
    flagGlobal: boolean = true;
    flagCaseInsensitive: boolean = false;
    flagMultiline: boolean = false;

    matches: RegexMatch[] = [];
    errorMessage: string = '';
    highlightedText: string = '';
    matchCount: number = 0;

    commonPatterns: RegexPattern[] = [
        {
            name: 'Email Address',
            pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
            description: 'Matches email addresses',
            flags: 'g'
        },
        {
            name: 'URL',
            pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
            description: 'Matches HTTP/HTTPS URLs',
            flags: 'g'
        },
        {
            name: 'Phone Number (US)',
            pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}',
            description: 'Matches US phone numbers',
            flags: 'g'
        },
        {
            name: 'IPv4 Address',
            pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
            description: 'Matches IPv4 addresses',
            flags: 'g'
        },
        {
            name: 'Date (YYYY-MM-DD)',
            pattern: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])',
            description: 'Matches dates in YYYY-MM-DD format',
            flags: 'g'
        },
        {
            name: 'Time (24h)',
            pattern: '([01]?\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?',
            description: 'Matches 24-hour time format',
            flags: 'g'
        },
        {
            name: 'Hex Color',
            pattern: '#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})',
            description: 'Matches hexadecimal color codes',
            flags: 'gi'
        },
        {
            name: 'Credit Card',
            pattern: '\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}',
            description: 'Matches credit card numbers',
            flags: 'g'
        },
        {
            name: 'HTML Tag',
            pattern: '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s+\\/>)',
            description: 'Matches HTML tags',
            flags: 'gi'
        },
        {
            name: 'Username',
            pattern: '^[a-zA-Z0-9_-]{3,16}$',
            description: 'Matches usernames (3-16 chars, alphanumeric, -, _)',
            flags: ''
        }
    ];

    testRegex(): void {
        this.matches = [];
        this.errorMessage = '';
        this.highlightedText = '';
        this.matchCount = 0;

        if (!this.regexPattern || !this.testString) {
            return;
        }

        try {
            const flags = this.buildFlags();
            const regex = new RegExp(this.regexPattern, flags);

            if (this.flagGlobal) {
                let match;
                while ((match = regex.exec(this.testString)) !== null) {
                    this.matches.push({
                        match: match[0],
                        index: match.index,
                        groups: match.slice(1)
                    });

                    // Prevent infinite loop on zero-width matches
                    if (match.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                }
            } else {
                const match = regex.exec(this.testString);
                if (match) {
                    this.matches.push({
                        match: match[0],
                        index: match.index,
                        groups: match.slice(1)
                    });
                }
            }

            this.matchCount = this.matches.length;
            this.highlightMatches();
        } catch (error) {
            this.errorMessage = `Invalid regex: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    private buildFlags(): string {
        let flags = '';
        if (this.flagGlobal) flags += 'g';
        if (this.flagCaseInsensitive) flags += 'i';
        if (this.flagMultiline) flags += 'm';
        return flags;
    }

    private highlightMatches(): void {
        if (this.matches.length === 0) {
            this.highlightedText = this.escapeHtml(this.testString);
            return;
        }

        let result = '';
        let lastIndex = 0;

        // Sort matches by index
        const sortedMatches = [...this.matches].sort((a, b) => a.index - b.index);

        sortedMatches.forEach((match, i) => {
            // Add text before match
            result += this.escapeHtml(this.testString.substring(lastIndex, match.index));

            // Add highlighted match
            result += `<mark class="match-highlight" data-match="${i + 1}">${this.escapeHtml(match.match)}</mark>`;

            lastIndex = match.index + match.match.length;
        });

        // Add remaining text
        result += this.escapeHtml(this.testString.substring(lastIndex));

        this.highlightedText = result;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }

    loadPattern(pattern: RegexPattern): void {
        this.regexPattern = pattern.pattern;
        if (pattern.flags) {
            this.flagGlobal = pattern.flags.includes('g');
            this.flagCaseInsensitive = pattern.flags.includes('i');
            this.flagMultiline = pattern.flags.includes('m');
        }
        this.testRegex();
    }

    loadSampleText(): void {
        this.testString = `Contact us at support@example.com or sales@company.org
Visit our website: https://www.example.com
Call us: (555) 123-4567 or 555-987-6543
Server IP: 192.168.1.1
Meeting scheduled for 2024-10-21 at 14:30:00
Brand colors: #FF5733, #33FF57, #3357FF
Order #1234-5678-9012-3456
Username: john_doe123`;
        this.testRegex();
    }

    clear(): void {
        this.regexPattern = '';
        this.testString = '';
        this.matches = [];
        this.errorMessage = '';
        this.highlightedText = '';
        this.matchCount = 0;
    }

    copyMatches(): void {
        const matchesText = this.matches.map(m => m.match).join('\n');
        if (matchesText) {
            navigator.clipboard.writeText(matchesText);
        }
    }

    replaceMatches(replacement: string): string {
        if (!this.regexPattern || !this.testString) {
            return '';
        }

        try {
            const flags = this.buildFlags();
            const regex = new RegExp(this.regexPattern, flags);
            return this.testString.replace(regex, replacement);
        } catch (error) {
            return 'Error in replacement';
        }
    }
}
