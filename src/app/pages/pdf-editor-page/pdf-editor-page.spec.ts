import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfEditorPage } from './pdf-editor-page';

describe('PdfEditorPage', () => {
    let component: PdfEditorPage;
    let fixture: ComponentFixture<PdfEditorPage>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PdfEditorPage]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PdfEditorPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
