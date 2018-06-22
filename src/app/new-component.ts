import { Component } from '@angular/core';

@Component({
 selector: 'new-component',
 template: `<h2>new thing</h2><mat-select><mat-option [value]="'foo'">foo</mat-option></mat-select>`,
})
export class NewComponent {
}

