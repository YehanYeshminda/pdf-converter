import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfConverterPage } from './pdf-converter-page';

describe('PdfConverterPage', () => {
  let component: PdfConverterPage;
  let fixture: ComponentFixture<PdfConverterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfConverterPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfConverterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
