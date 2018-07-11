import { Component } from '@angular/core';

@Component({
  selector: 'new-component',
  template: `<h2>new thing</h2>
<mat-form-field><mat-select placeholder="question"><mat-option [value]="'foo'">foo</mat-option><mat-option [value]="'bar'">bar</mat-option></mat-select></mat-form-field>
<selector></selector>`,
})
export class NewComponent {
}

