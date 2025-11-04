import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfSignaturePage } from './pdf-signature-page';

describe('PdfSignaturePage', () => {
  let component: PdfSignaturePage;
  let fixture: ComponentFixture<PdfSignaturePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfSignaturePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfSignaturePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
