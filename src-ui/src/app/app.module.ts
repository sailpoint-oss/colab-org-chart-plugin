import { NgModule, Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { ReactiveFormsModule } from '@angular/forms';
import { DataService } from './services/data/data.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';

// import ngx-translate and the http loader
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslationLoader } from './utils/translationLoader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { D3OrgChartComponent } from './components/d3-org-chart/d3-org-chart.component';
import { APP_BASE_HREF } from '@angular/common';
import { environment } from 'src/environments/environment';
import { NodeDetailsComponent } from './components/node-details/node-details.component';
import { JoyrideModule } from 'ngx-joyride';
import { RouterModule } from "@angular/router";

declare const PluginHelper: {
  getPluginFileUrl: Function
};

@NgModule({
  declarations: [
    AppComponent,
    D3OrgChartComponent,
    NodeDetailsComponent
  ],
  imports: [
    JoyrideModule.forRoot(), 
    RouterModule.forRoot([
      {
        path: ':id',
        component: D3OrgChartComponent
      },
      {
        path: '',
        component: D3OrgChartComponent
      }
    ]),
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right',
      preventDuplicates: true
    }),
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatTabsModule,
    MatTableModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatBadgeModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useClass: TranslationLoader
      }
  })
  ],
  providers: [
    { 
      provide: APP_BASE_HREF, 
      useFactory: () => {
        if (environment.production) {
          return window.location.pathname + window.location.search;
        } else {
          return '/';
        }
      }  
    },
    DataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }