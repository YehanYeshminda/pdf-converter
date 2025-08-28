import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchBase64Converter } from './batch-base64-converter';

describe('BatchBase64Converter', () => {
  let component: BatchBase64Converter;
  let fixture: ComponentFixture<BatchBase64Converter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchBase64Converter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatchBase64Converter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
