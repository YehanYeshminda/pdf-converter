🧭 Angular Clean Code & Performance Guidelines

These instructions define how to write clean, performant, and maintainable Angular code — especially for projects built with Angular 19+, TypeScript 5+, RxJS 7+, TailwindCSS, and Capacitor.

1️⃣ Clean Angular Code Principles
🔤 Naming Conventions

Components: Use PascalCase and end with Component (e.g., PdfViewerComponent)

Services: Use PascalCase and end with Service (e.g., AuthService)

Directives: Use PascalCase and end with Directive

Pipes: Use PascalCase and end with Pipe

Variables / Methods: Use camelCase

Constants: Use UPPER_SNAKE_CASE

Selectors: Use app- prefix (e.g., <app-header>)

🧩 Component Design

Keep each component focused on one UI responsibility

Avoid large components; prefer splitting into smaller reusable ones

Use @Input() and @Output() cleanly — no business logic in templates

Use ChangeDetectionStrategy.OnPush for stateless components

Handle data fetching inside services, not components

📁 Project Structure

Follow Angular style guide structure:

src/app/
 ├── core/             → Singleton services, interceptors, guards
 ├── shared/           → Reusable UI components, pipes, directives
 ├── features/         → Feature modules (e.g., pdf, auth)
 ├── services/         → Cross-feature services
 ├── models/           → Interfaces & types
 ├── environments/     → Env configs
 └── app.module.ts


Keep feature code modular with lazy-loaded routes.

📘 Code Style & Documentation

Follow Angular’s Style Guide

Write self-explanatory code

Use JSDoc/TSDoc for services, models, and public APIs

Comment why, not what

Keep code formatted using Prettier ("parser": "angular" for HTML)

🚫 Code Quality

Remove unused imports, services, and variables

Avoid logic duplication — refactor common code into services

Follow DRY and SOLID principles

Use async pipes in templates instead of manual subscriptions

Prefer Angular reactive forms over template-driven for complex logic

2️⃣ Angular Performance Optimization
⚙️ Change Detection

Use OnPush wherever possible

Avoid mutating arrays/objects directly

Leverage trackBy in *ngFor loops to reduce re-rendering

🧮 RxJS Optimization

Unsubscribe using takeUntil, async pipe, or Subscription cleanup

Avoid unnecessary nested subscriptions — use switchMap, mergeMap

Use Subjects for controlled event streams

Use debounceTime for search or resize events

💾 Lazy Loading

Lazy-load feature modules via loadChildren

Use standalone components for smaller, isolated features

Implement route preloading strategies for faster navigation

📦 Bundling & Assets

Optimize images with ngx-image-compress

Use Angular CLI’s production build with --configuration production

Keep dependencies minimal and updated

Use TailwindCSS purge to remove unused styles

3️⃣ Angular Best Practices for Maintainability
🧪 Testing

Use Jasmine + Karma (included) or Jest for faster tests

Write unit tests for:

Services → logic validation

Components → UI behavior

Pipes → transformation correctness

Aim for 80%+ coverage

Mock HTTP using HttpClientTestingModule

🪄 Version Control & Workflow

Use feature branches per module or enhancement

Write meaningful commits:
feat(pdf): add base64 conversion service

Run ng lint && ng test before commits

Use Git hooks (e.g., Husky) for pre-commit linting

🧹 Refactoring & Maintenance

Regularly refactor large components or services

Move duplicated logic to shared utilities

Identify and pay off technical debt early

Use ESLint for static code analysis (ng lint)

🧠 Continuous Learning

Stay updated with Angular’s official changelogs

Follow Angular.dev and Material design updates

Review RxJS patterns and Capacitor integrations

Read code from official Angular examples and repositories

🔒 Security

Always sanitize inputs (DomSanitizer for HTML)

Never store secrets in frontend code

Use environment variables for API URLs

Validate form data and prevent XSS

Use HTTP interceptors for token handling

⚠️ Error Handling & Logging

Handle async errors via .pipe(catchError())

Use global error handler (ErrorHandler class)

Display user-friendly messages

Log errors to an external monitoring service (e.g., Sentry)

📝 Documentation

Maintain updated README.md and module READMEs

Generate API docs using Compodoc or TSDoc

Keep changelog in CHANGELOG.md

Provide clear setup and build instructions

✅ Angular Implementation Checklist
Category	Check
Naming follows Angular standards	☐
Components are small and focused	☐
No code duplication	☐
OnPush and trackBy used properly	☐
RxJS streams handled safely	☐
Tests written and passing	☐
Documentation updated	☐
Lint & Prettier clean	☐
Dependencies optimized	☐
🧰 Recommended Angular Tools
Purpose	Tool
Linting	ESLint (@angular-eslint/schematics)
Formatting	Prettier (configured for Angular templates)
Testing	Jasmine + Karma or Jest
Profiling	Chrome DevTools → Performance tab
Docs	Compodoc
Styling	TailwindCSS
Performance	Angular DevTools extension
📚 Suggested Learning

📘 Angular Style Guide — angular.dev/styleguide

📗 Clean Code — Robert C. Martin

💡 RxJS Docs — learn observables and operators

🧩 Angular Material & CDK — for UI/UX patterns

⚡ Capacitor Plugins — for native device integrations