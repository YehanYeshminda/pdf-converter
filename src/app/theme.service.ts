import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private storageKey = 'yydev-dark-mode';

    isDark(): boolean {
        try {
            const val = localStorage.getItem(this.storageKey);
            if (val !== null) return val === '1';
        } catch (e) { }
        
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setDark(dark: boolean) {
        try {
            localStorage.setItem(this.storageKey, dark ? '1' : '0');
        } catch (e) { }
        this.applyClass(dark);
    }

    toggle() {
        this.setDark(!this.isDark());
    }

    applyClass(dark: boolean) {
        try {
            if (dark) {
                document.documentElement.classList.add('dark-mode');
                document.documentElement.style.setProperty('color-scheme', 'dark');
            } else {
                document.documentElement.classList.remove('dark-mode');
                document.documentElement.style.setProperty('color-scheme', 'light');
            }
        } catch (e) { }
    }
}
