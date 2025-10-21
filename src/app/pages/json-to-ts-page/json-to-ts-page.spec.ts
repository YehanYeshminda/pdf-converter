import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonToTsPage } from './json-to-ts-page';

describe('JsonToTsPage', () => {
    let component: JsonToTsPage;
    let fixture: ComponentFixture<JsonToTsPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [JsonToTsPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(JsonToTsPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
