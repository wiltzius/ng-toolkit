import { NgModule } from '@angular/core';

// import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { NewComponent } from './new-component';
import { SelectorComponent } from './selector';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatSelectModule,
  ],
  declarations: [NewComponent, SelectorComponent],
  exports: [
    MatSelectModule
  ],
  entryComponents: [NewComponent]
})
export class AppModule {
  ngDoBootstrap() {
  }
}
