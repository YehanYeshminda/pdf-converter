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
import { MatSelectModule } from '@angular/material/select';

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
        MatCheckboxModule,
        MatSelectModule
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
    outputLanguage: 'typescript' | 'csharp' | 'python' | 'java' | 'go' | 'rust' | 'kotlin' = 'typescript';

    convert(): void {
        if (!this.jsonInput.trim()) {
            this.tsOutput = '';
            return;
        }

        try {
            const jsonObject = JSON.parse(this.jsonInput);
            switch (this.outputLanguage) {
                case 'typescript':
                    this.tsOutput = this.generateTypeScriptInterface(jsonObject, this.interfaceName);
                    break;
                case 'csharp':
                    this.tsOutput = this.generateCSharpClass(jsonObject, this.interfaceName);
                    break;
                case 'python':
                    this.tsOutput = this.generatePythonClass(jsonObject, this.interfaceName);
                    break;
                case 'java':
                    this.tsOutput = this.generateJavaClass(jsonObject, this.interfaceName);
                    break;
                case 'go':
                    this.tsOutput = this.generateGoStruct(jsonObject, this.interfaceName);
                    break;
                case 'rust':
                    this.tsOutput = this.generateRustStruct(jsonObject, this.interfaceName);
                    break;
                case 'kotlin':
                    this.tsOutput = this.generateKotlinDataClass(jsonObject, this.interfaceName);
                    break;
            }
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

            if (nestedInterfaces.length > 0) {
                result += nestedInterfaces.join('\n\n') + '\n\n';
            }

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
        if (parentName.endsWith('s')) {
            return parentName.slice(0, -1);
        }
        if (parentName.endsWith('List')) {
            return parentName.slice(0, -4);
        }
        return parentName + 'Item';
    }

    private generateCSharpClass(obj: any, name: string, indent: string = ''): string {
        if (obj === null) {
            return 'object';
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return 'List<object>';
            }
            const firstItem = obj[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
                const itemType = this.getArrayItemTypeName(name);
                return this.generateCSharpClass(firstItem, itemType, indent) + '\n// Use: List<' + itemType + '>';
            }
            return `List<${this.getCSharpType(firstItem)}>`;
        }

        if (typeof obj === 'object') {
            const properties: string[] = [];
            const nestedClasses: string[] = [];

            for (const [key, value] of Object.entries(obj)) {
                const propertyName = this.capitalize(key);

                if (Array.isArray(value)) {
                    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        const itemTypeName = this.capitalize(key) + 'Item';
                        nestedClasses.push(this.generateCSharpClass(value[0], itemTypeName, indent));
                        properties.push(`${indent}    public List<${itemTypeName}> ${propertyName} { get; set; }`);
                    } else {
                        const itemType = value.length > 0 ? this.getCSharpType(value[0]) : 'object';
                        properties.push(`${indent}    public List<${itemType}> ${propertyName} { get; set; }`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    const nestedTypeName = this.capitalize(key);
                    nestedClasses.push(this.generateCSharpClass(value, nestedTypeName, indent));
                    properties.push(`${indent}    public ${nestedTypeName} ${propertyName} { get; set; }`);
                } else {
                    const csharpType = this.getCSharpType(value);
                    const nullable = this.useOptionalFields && csharpType !== 'string' ? '?' : '';
                    properties.push(`${indent}    public ${csharpType}${nullable} ${propertyName} { get; set; }`);
                }
            }

            let result = '';

            if (nestedClasses.length > 0) {
                result += nestedClasses.join('\n\n') + '\n\n';
            }

            result += `${indent}public class ${name}\n${indent}{\n`;
            result += properties.join('\n');
            result += `\n${indent}}`;

            return result;
        }

        return this.getCSharpType(obj);
    }

    private getCSharpType(value: any): string {
        if (value === null) return 'object';
        if (value === undefined) return 'object';

        const type = typeof value;

        switch (type) {
            case 'string':
                return 'string';
            case 'number':
                return Number.isInteger(value) ? 'int' : 'double';
            case 'boolean':
                return 'bool';
            case 'object':
                return 'object';
            default:
                return 'object';
        }
    }

    changeOutputLanguage(): void {
        this.convert();
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

    private generatePythonClass(obj: any, name: string, indent: string = ''): string {
        if (obj === null) {
            return 'None';
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return 'List[Any]';
            }
            const firstItem = obj[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
                const itemType = this.getArrayItemTypeName(name);
                return this.generatePythonClass(firstItem, itemType, indent) + '\n# Use: List[' + itemType + ']';
            }
            return `List[${this.getPythonType(firstItem)}]`;
        }

        if (typeof obj === 'object') {
            const properties: string[] = [];
            const nestedClasses: string[] = [];

            for (const [key, value] of Object.entries(obj)) {
                if (Array.isArray(value)) {
                    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        const itemTypeName = this.capitalize(key) + 'Item';
                        nestedClasses.push(this.generatePythonClass(value[0], itemTypeName, indent));
                        properties.push(`${indent}    ${key}: List[${itemTypeName}]`);
                    } else {
                        const itemType = value.length > 0 ? this.getPythonType(value[0]) : 'Any';
                        properties.push(`${indent}    ${key}: List[${itemType}]`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    const nestedTypeName = this.capitalize(key);
                    nestedClasses.push(this.generatePythonClass(value, nestedTypeName, indent));
                    properties.push(`${indent}    ${key}: ${nestedTypeName}`);
                } else {
                    const pythonType = this.getPythonType(value);
                    const optional = this.useOptionalFields ? `Optional[${pythonType}]` : pythonType;
                    properties.push(`${indent}    ${key}: ${optional}`);
                }
            }

            let result = '';

            if (nestedClasses.length > 0) {
                result += nestedClasses.join('\n\n') + '\n\n';
            }

            result += `${indent}class ${name}:\n`;
            result += properties.join('\n');

            return result;
        }

        return this.getPythonType(obj);
    }

    private getPythonType(value: any): string {
        if (value === null) return 'None';
        if (value === undefined) return 'Any';

        const type = typeof value;

        switch (type) {
            case 'string':
                return 'str';
            case 'number':
                return Number.isInteger(value) ? 'int' : 'float';
            case 'boolean':
                return 'bool';
            case 'object':
                return 'dict';
            default:
                return 'Any';
        }
    }

    private generateJavaClass(obj: any, name: string, indent: string = ''): string {
        if (obj === null) {
            return 'Object';
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return 'List<Object>';
            }
            const firstItem = obj[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
                const itemType = this.getArrayItemTypeName(name);
                return this.generateJavaClass(firstItem, itemType, indent) + '\n// Use: List<' + itemType + '>';
            }
            return `List<${this.getJavaType(firstItem)}>`;
        }

        if (typeof obj === 'object') {
            const properties: string[] = [];
            const nestedClasses: string[] = [];

            for (const [key, value] of Object.entries(obj)) {
                const propertyName = key;

                if (Array.isArray(value)) {
                    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        const itemTypeName = this.capitalize(key) + 'Item';
                        nestedClasses.push(this.generateJavaClass(value[0], itemTypeName, indent));
                        properties.push(`${indent}    private List<${itemTypeName}> ${propertyName};`);
                    } else {
                        const itemType = value.length > 0 ? this.getJavaType(value[0]) : 'Object';
                        properties.push(`${indent}    private List<${itemType}> ${propertyName};`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    const nestedTypeName = this.capitalize(key);
                    nestedClasses.push(this.generateJavaClass(value, nestedTypeName, indent));
                    properties.push(`${indent}    private ${nestedTypeName} ${propertyName};`);
                } else {
                    const javaType = this.getJavaType(value);
                    properties.push(`${indent}    private ${javaType} ${propertyName};`);
                }
            }

            let result = '';

            if (nestedClasses.length > 0) {
                result += nestedClasses.join('\n\n') + '\n\n';
            }

            result += `${indent}public class ${name} {\n`;
            result += properties.join('\n');
            result += `\n${indent}    // Getters and setters omitted for brevity\n`;
            result += `${indent}}`;

            return result;
        }

        return this.getJavaType(obj);
    }

    private getJavaType(value: any): string {
        if (value === null) return 'Object';
        if (value === undefined) return 'Object';

        const type = typeof value;

        switch (type) {
            case 'string':
                return 'String';
            case 'number':
                return Number.isInteger(value) ? 'Integer' : 'Double';
            case 'boolean':
                return 'Boolean';
            case 'object':
                return 'Object';
            default:
                return 'Object';
        }
    }

    private generateGoStruct(obj: any, name: string, indent: string = ''): string {
        if (obj === null) {
            return 'interface{}';
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return '[]interface{}';
            }
            const firstItem = obj[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
                const itemType = this.getArrayItemTypeName(name);
                return this.generateGoStruct(firstItem, itemType, indent) + '\n// Use: []' + itemType;
            }
            return `[]${this.getGoType(firstItem)}`;
        }

        if (typeof obj === 'object') {
            const properties: string[] = [];
            const nestedStructs: string[] = [];

            for (const [key, value] of Object.entries(obj)) {
                const propertyName = this.capitalize(key);
                const jsonTag = `\`json:"${key}"\``;

                if (Array.isArray(value)) {
                    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        const itemTypeName = this.capitalize(key) + 'Item';
                        nestedStructs.push(this.generateGoStruct(value[0], itemTypeName, indent));
                        properties.push(`${indent}    ${propertyName} []${itemTypeName} ${jsonTag}`);
                    } else {
                        const itemType = value.length > 0 ? this.getGoType(value[0]) : 'interface{}';
                        properties.push(`${indent}    ${propertyName} []${itemType} ${jsonTag}`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    const nestedTypeName = this.capitalize(key);
                    nestedStructs.push(this.generateGoStruct(value, nestedTypeName, indent));
                    properties.push(`${indent}    ${propertyName} ${nestedTypeName} ${jsonTag}`);
                } else {
                    const goType = this.getGoType(value);
                    const pointer = this.useOptionalFields ? '*' : '';
                    properties.push(`${indent}    ${propertyName} ${pointer}${goType} ${jsonTag}`);
                }
            }

            let result = '';

            if (nestedStructs.length > 0) {
                result += nestedStructs.join('\n\n') + '\n\n';
            }

            result += `${indent}type ${name} struct {\n`;
            result += properties.join('\n');
            result += `\n${indent}}`;

            return result;
        }

        return this.getGoType(obj);
    }

    private getGoType(value: any): string {
        if (value === null) return 'interface{}';
        if (value === undefined) return 'interface{}';

        const type = typeof value;

        switch (type) {
            case 'string':
                return 'string';
            case 'number':
                return Number.isInteger(value) ? 'int' : 'float64';
            case 'boolean':
                return 'bool';
            case 'object':
                return 'interface{}';
            default:
                return 'interface{}';
        }
    }

    private generateRustStruct(obj: any, name: string, indent: string = ''): string {
        if (obj === null) {
            return 'Option<serde_json::Value>';
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return 'Vec<serde_json::Value>';
            }
            const firstItem = obj[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
                const itemType = this.getArrayItemTypeName(name);
                return this.generateRustStruct(firstItem, itemType, indent) + '\n// Use: Vec<' + itemType + '>';
            }
            return `Vec<${this.getRustType(firstItem)}>`;
        }

        if (typeof obj === 'object') {
            const properties: string[] = [];
            const nestedStructs: string[] = [];

            for (const [key, value] of Object.entries(obj)) {
                const propertyName = key;

                if (Array.isArray(value)) {
                    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        const itemTypeName = this.capitalize(key) + 'Item';
                        nestedStructs.push(this.generateRustStruct(value[0], itemTypeName, indent));
                        properties.push(`${indent}    pub ${propertyName}: Vec<${itemTypeName}>,`);
                    } else {
                        const itemType = value.length > 0 ? this.getRustType(value[0]) : 'serde_json::Value';
                        properties.push(`${indent}    pub ${propertyName}: Vec<${itemType}>,`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    const nestedTypeName = this.capitalize(key);
                    nestedStructs.push(this.generateRustStruct(value, nestedTypeName, indent));
                    properties.push(`${indent}    pub ${propertyName}: ${nestedTypeName},`);
                } else {
                    const rustType = this.getRustType(value);
                    const optional = this.useOptionalFields ? `Option<${rustType}>` : rustType;
                    properties.push(`${indent}    pub ${propertyName}: ${optional},`);
                }
            }

            let result = '';

            if (nestedStructs.length > 0) {
                result += nestedStructs.join('\n\n') + '\n\n';
            }

            result += `${indent}#[derive(Debug, Serialize, Deserialize)]\n`;
            result += `${indent}pub struct ${name} {\n`;
            result += properties.join('\n');
            result += `\n${indent}}`;

            return result;
        }

        return this.getRustType(obj);
    }

    private getRustType(value: any): string {
        if (value === null) return 'Option<serde_json::Value>';
        if (value === undefined) return 'serde_json::Value';

        const type = typeof value;

        switch (type) {
            case 'string':
                return 'String';
            case 'number':
                return Number.isInteger(value) ? 'i32' : 'f64';
            case 'boolean':
                return 'bool';
            case 'object':
                return 'serde_json::Value';
            default:
                return 'serde_json::Value';
        }
    }

    private generateKotlinDataClass(obj: any, name: string, indent: string = ''): string {
        if (obj === null) {
            return 'Any?';
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return 'List<Any>';
            }
            const firstItem = obj[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
                const itemType = this.getArrayItemTypeName(name);
                return this.generateKotlinDataClass(firstItem, itemType, indent) + '\n// Use: List<' + itemType + '>';
            }
            return `List<${this.getKotlinType(firstItem)}>`;
        }

        if (typeof obj === 'object') {
            const properties: string[] = [];
            const nestedClasses: string[] = [];

            for (const [key, value] of Object.entries(obj)) {
                const propertyName = key;

                if (Array.isArray(value)) {
                    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        const itemTypeName = this.capitalize(key) + 'Item';
                        nestedClasses.push(this.generateKotlinDataClass(value[0], itemTypeName, indent));
                        properties.push(`    val ${propertyName}: List<${itemTypeName}>`);
                    } else {
                        const itemType = value.length > 0 ? this.getKotlinType(value[0]) : 'Any';
                        properties.push(`    val ${propertyName}: List<${itemType}>`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    const nestedTypeName = this.capitalize(key);
                    nestedClasses.push(this.generateKotlinDataClass(value, nestedTypeName, indent));
                    properties.push(`    val ${propertyName}: ${nestedTypeName}`);
                } else {
                    const kotlinType = this.getKotlinType(value);
                    const nullable = this.useOptionalFields ? '?' : '';
                    properties.push(`    val ${propertyName}: ${kotlinType}${nullable}`);
                }
            }

            let result = '';

            if (nestedClasses.length > 0) {
                result += nestedClasses.join('\n\n') + '\n\n';
            }

            result += `${indent}data class ${name}(\n`;
            result += properties.join(',\n');
            result += `\n${indent})`;

            return result;
        }

        return this.getKotlinType(obj);
    }

    private getKotlinType(value: any): string {
        if (value === null) return 'Any?';
        if (value === undefined) return 'Any';

        const type = typeof value;

        switch (type) {
            case 'string':
                return 'String';
            case 'number':
                return Number.isInteger(value) ? 'Int' : 'Double';
            case 'boolean':
                return 'Boolean';
            case 'object':
                return 'Any';
            default:
                return 'Any';
        }
    }
}
