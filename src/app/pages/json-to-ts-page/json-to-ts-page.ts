import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
    selector: 'app-json-to-ts-page',
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatTooltipModule,
        MatCheckboxModule
    ],
    templateUrl: './json-to-ts-page.html',
    styleUrl: './json-to-ts-page.scss'
})
export class JsonToTsPage {
    jsonInput: string = '';
    tsOutput: string = '';
    interfaceName: string = 'RootObject';
    useOptionalFields: boolean = false;
    useReadonly: boolean = false;

    convert(): void {
        if (!this.jsonInput.trim()) {
            this.tsOutput = '';
            return;
        }

        try {
            const jsonObject = JSON.parse(this.jsonInput);
            this.tsOutput = this.generateTypeScriptInterface(jsonObject, this.interfaceName);
        } catch (error) {
            this.tsOutput = `// Error: Invalid JSON\n// ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    private generateTypeScriptInterface(obj: any, name: string, indent: string = ''): string {
        if (obj === null) {
            return 'null';
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return 'any[]';
            }
            const firstItem = obj[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
                const itemType = this.getArrayItemTypeName(name);
                return this.generateTypeScriptInterface(firstItem, itemType, indent) + '[]';
            }
            return `${this.getType(firstItem)}[]`;
        }

        if (typeof obj === 'object') {
            const properties: string[] = [];
            const nestedInterfaces: string[] = [];

            for (const [key, value] of Object.entries(obj)) {
                const optional = this.useOptionalFields ? '?' : '';
                const readonly = this.useReadonly ? 'readonly ' : '';

                if (Array.isArray(value)) {
                    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        const itemTypeName = this.capitalize(key) + 'Item';
                        nestedInterfaces.push(this.generateTypeScriptInterface(value[0], itemTypeName, indent));
                        properties.push(`${indent}  ${readonly}${key}${optional}: ${itemTypeName}[];`);
                    } else {
                        const itemType = value.length > 0 ? this.getType(value[0]) : 'any';
                        properties.push(`${indent}  ${readonly}${key}${optional}: ${itemType}[];`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    const nestedTypeName = this.capitalize(key);
                    nestedInterfaces.push(this.generateTypeScriptInterface(value, nestedTypeName, indent));
                    properties.push(`${indent}  ${readonly}${key}${optional}: ${nestedTypeName};`);
                } else {
                    properties.push(`${indent}  ${readonly}${key}${optional}: ${this.getType(value)};`);
                }
            }

            let result = '';

            // Add nested interfaces first
            if (nestedInterfaces.length > 0) {
                result += nestedInterfaces.join('\n\n') + '\n\n';
            }

            // Add main interface
            result += `${indent}export interface ${name} {\n`;
            result += properties.join('\n');
            result += `\n${indent}}`;

            return result;
        }

        return this.getType(obj);
    }

    private getType(value: any): string {
        if (value === null) return 'null';
        if (value === undefined) return 'any';

        const type = typeof value;

        switch (type) {
            case 'string':
                return 'string';
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'object':
                return 'object';
            default:
                return 'any';
        }
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private getArrayItemTypeName(parentName: string): string {
        // Remove 's' or 'List' suffix if exists, then add 'Item'
        if (parentName.endsWith('s')) {
            return parentName.slice(0, -1);
        }
        if (parentName.endsWith('List')) {
            return parentName.slice(0, -4);
        }
        return parentName + 'Item';
    }

    copyOutput(): void {
        if (this.tsOutput && !this.tsOutput.startsWith('// Error')) {
            navigator.clipboard.writeText(this.tsOutput);
        }
    }

    clear(): void {
        this.jsonInput = '';
        this.tsOutput = '';
    }

    loadSampleJson(): void {
        this.jsonInput = `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "isActive": true,
  "age": 30,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001"
  },
  "hobbies": ["reading", "gaming", "coding"],
  "orders": [
    {
      "orderId": "ORD-001",
      "total": 99.99,
      "items": ["Laptop", "Mouse"]
    }
  ]
}`;
        this.convert();
    }
}
