import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-text-encoder-page',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './text-encoder-page.html',
  styleUrl: './text-encoder-page.scss'
})
export class TextEncoderPage {
  inputText: string = '';
  outputText: string = '';
  encodingType: string = 'base64';

  encodingOptions = [
    { value: 'base64', label: 'Base64', toolTip: 'Encode text to Base64 format' },
    { value: 'uri', label: 'URI Component', toolTip: 'Encode text for use in a URI' },
    { value: 'hex', label: 'Hexadecimal', toolTip: 'Encode text to hexadecimal format' },
    { value: 'binary', label: 'Binary', toolTip: 'Encode text to binary format' }
  ];

  encode(): void {
    if (!this.inputText) {
      this.outputText = '';
      return;
    }

    try {
      switch (this.encodingType) {
        case 'base64':
          this.outputText = btoa(unescape(encodeURIComponent(this.inputText)));
          break;
        case 'uri':
          this.outputText = encodeURIComponent(this.inputText);
          break;
        case 'hex':
          this.outputText = Array.from(this.inputText)
            .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');
          break;
        case 'binary':
          this.outputText = Array.from(this.inputText)
            .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
            .join(' ');
          break;
      }
    } catch (error) {
      this.outputText = 'Error encoding text';
    }
  }

  decode(): void {
    if (!this.inputText) {
      this.outputText = '';
      return;
    }

    try {
      switch (this.encodingType) {
        case 'base64':
          this.outputText = decodeURIComponent(escape(atob(this.inputText)));
          break;
        case 'uri':
          this.outputText = decodeURIComponent(this.inputText);
          break;
        case 'hex':
          this.outputText = this.inputText
            .match(/.{1,2}/g)
            ?.map(hex => String.fromCharCode(parseInt(hex, 16)))
            .join('') || '';
          break;
        case 'binary':
          this.outputText = this.inputText
            .split(' ')
            .map(bin => String.fromCharCode(parseInt(bin, 2)))
            .join('');
          break;
      }
    } catch (error) {
      this.outputText = 'Error decoding text';
    }
  }

  copyOutput(): void {
    if (this.outputText) {
      navigator.clipboard.writeText(this.outputText);
    }
  }

  clear(): void {
    this.inputText = '';
    this.outputText = '';
  }

  swap(): void {
    const temp = this.inputText;
    this.inputText = this.outputText;
    this.outputText = temp;
  }
}
