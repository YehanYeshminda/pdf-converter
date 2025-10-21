import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegexTesterPage } from './regex-tester-page';

describe('RegexTesterPage', () => {
    let component: RegexTesterPage;
    let fixture: ComponentFixture<RegexTesterPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RegexTesterPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(RegexTesterPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
