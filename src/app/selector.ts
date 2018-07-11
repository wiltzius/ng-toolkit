import { Component } from '@angular/core';

@Component({
  selector: 'selector',
  template: `<mat-select><mat-option [value]="'foo'">foo</mat-option><mat-option [value]="'bar'">bar</mat-option></mat-select>`,
})
export class SelectorComponent {
}
