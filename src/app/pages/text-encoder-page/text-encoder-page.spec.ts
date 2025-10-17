import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextEncoderPage } from './text-encoder-page';

describe('TextEncoderPage', () => {
  let component: TextEncoderPage;
  let fixture: ComponentFixture<TextEncoderPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextEncoderPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextEncoderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
