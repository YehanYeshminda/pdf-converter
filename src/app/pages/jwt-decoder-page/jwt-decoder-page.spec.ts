import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JwtDecoderPage } from './jwt-decoder-page';

describe('JwtDecoderPage', () => {
    let component: JwtDecoderPage;
    let fixture: ComponentFixture<JwtDecoderPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [JwtDecoderPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(JwtDecoderPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
