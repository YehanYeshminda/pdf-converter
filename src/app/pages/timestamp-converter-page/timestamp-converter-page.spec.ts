import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimestampConverterPage } from './timestamp-converter-page';

describe('TimestampConverterPage', () => {
    let component: TimestampConverterPage;
    let fixture: ComponentFixture<TimestampConverterPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TimestampConverterPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(TimestampConverterPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
