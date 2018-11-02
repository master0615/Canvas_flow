import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxGraphModule } from './ngx-graph';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ContextMenuModule } from 'ngx-contextmenu';
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule, 
    BrowserAnimationsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    NgbModule,
    NgxChartsModule,
    NgxGraphModule,
    ContextMenuModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
