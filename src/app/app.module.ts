import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EchoService } from './services/echo.service';
import { HttpClientModule } from '@angular/common/http';
import { MatSelectModule } from '@angular/material';
import { NewComponent } from './new-component';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatSelectModule,
  ],
  declarations: [AppComponent, NewComponent],
  providers: [EchoService],
  exports: [
    // MatSelectModule
  ]
})
export class AppModule {
  ngDoBootstrap() {
  }
}

