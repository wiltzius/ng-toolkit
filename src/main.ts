import 'zone.js/dist/zone';

import 'angular';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { downgradeComponent, downgradeModule } from '@angular/upgrade/static';
import { MatSelectModule } from '@angular/material/select';
import { NewComponent } from './app/new-component';
import { StaticProvider } from '@angular/core';

declare const angular: any;

// Downgraded Angular 2 app
const bootstrapFn = (extraProviders: StaticProvider[]) => {
    return platformBrowserDynamic(extraProviders).bootstrapModule(AppModule);
  }
;
const downgradedModule = downgradeModule(bootstrapFn);

// list of Angular 1 app dependencies, which includes the downgraded Angular 2 app
const welkin_ng_deps = [
  downgradedModule,
];

// the Angular 1 app declaration
export const ang1app = angular.module('Ang1App', welkin_ng_deps);

// Add a downgraded component to the angular 1 app
ang1app.directive('newComponent', downgradeComponent({component: NewComponent}));

// add an Angular 1 component that references the downgraded component
ang1app.component('someComponent', {
  template: `<div><h1>angular 1 app out here</h1><new-component></new-component></div>`,
  controller: class {
  },
  bindings: {}
});

// perform the actual bootstrap
angular.bootstrap(document, ['Ang1App'], {strictDi: true});
