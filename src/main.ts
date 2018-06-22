import 'zone.js/dist/zone';

import 'angular';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { downgradeComponent, downgradeModule } from '@angular/upgrade/static';
import { MatSelectModule } from '@angular/material/select';
import { NewComponent } from './app/new-component';

declare const angular: any;
// declare var ang1app: any;

const bootstrapFn = () => {
  const platformRef = platformBrowserDynamic();
  return platformRef.bootstrapModule(AppModule);
};
const downgradedModule = downgradeModule(bootstrapFn);

// list of Angular 1 app dependencies, which includes the downgraded Angular 2 app
const welkin_ng_deps = [
  downgradedModule,
];

// the Angular 1 app declaration
export const ang1app = angular.module('Ang1App', welkin_ng_deps);

ang1app.directive('newComponent', downgradeComponent({component: NewComponent}));

angular.bootstrap(document, ['Ang1App'], {strictDi: true});
