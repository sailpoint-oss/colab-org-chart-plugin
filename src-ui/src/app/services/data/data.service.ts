import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, Observer } from 'rxjs';
import { environment } from './../../../environments/environment';
import { MessageService } from '../message/message.service';

declare const PluginHelper: {
  getCsrfToken: Function
  getPluginRestUrl: Function
  getCurrentUsername: Function
};

@Injectable({
  providedIn: 'root'
})
export class DataService {
  token: string = '';
  pluginUrl: string = '';
  iiqUrl: string;
  currentUserName: string;

  constructor(
    private http : HttpClient,
    private messages: MessageService
  ) {
    if (environment.production) {
      this.pluginUrl = PluginHelper.getPluginRestUrl('orgchartplugin');
      this.iiqUrl = window.location.origin + "/" + window.location.pathname.split('/')[1];
      this.token = PluginHelper.getCsrfToken();
      this.currentUserName = PluginHelper.getCurrentUsername();
    } else {
      this.pluginUrl = 'http://192.168.15.129:8080/identityiq/plugin/rest/orgchartplugin';
      this.iiqUrl = 'http://192.168.15.129:8080/identityiq';
      this.currentUserName = 'spadmin';
    }
  }
  
  fetchSuggest = (path: string, filter? : any) => {
    return new Observable((observer: Observer<any>) => {
      const url = this.iiqUrl + path;
      let headers;
      if (environment.production) {
        headers = this.defaultHeaders();
      } else {
        headers = this.defaultHeadersDev();
      }

      this.http['post']<Request>(url, filter, { headers : headers }).subscribe((res: any) => {
        if (res === null) {
          this.messages.showError("Response is null.");
        } 
        if (res['errors'] !== null && res['errors'] !== undefined) {
          this.messages.showError(res['errors']);
        }
        if (res['warnings'] !== null && res['warnings'] !== undefined) {
          this.messages.showWarning(res['warnings']);
        }
        observer.next(res);
        observer.complete();
      }, (err: HttpErrorResponse) => {
        this.messages.getErrorMessage(observer, err);
      })
    });
  }

  fetch = (path: string, filter? : any, method: string = 'get') => {
    return new Observable((observer: Observer<any>) => {
      const url = this.pluginUrl + path;
      let headers;
      if (environment.production) {
        headers = this.defaultHeaders();
      } else {
        headers = this.defaultHeadersDev();
      }

      if (method === 'get') {
        this.http[method]<Request>(url, { headers : headers }).subscribe((res: any) => {
          if (res === null) {
            this.messages.showError("Response is null.");
          } else if (res['statusCodeValue'] && (res.statusCodeValue.toString().startsWith('2') === false) ) {
            if (res.body && res.body.message && res.body.message.length > 0) {
              this.messages.showError(res.body.message);
            }
          }
          observer.next(res);
          observer.complete();
        }, (err: HttpErrorResponse) => {
          this.messages.getErrorMessage(observer, err);
        })
      } else if (method === 'post') {
        this.http[method]<Request>(url, filter, { headers : headers }).subscribe((res: any) => {
          if (res === null) {
            this.messages.showError("Response is null.");
          } else if (res['statusCodeValue'] && (res.statusCodeValue.toString().startsWith('2') === false) ) {
            if (res.body && res.body.message && res.body.message.length > 0) {
              this.messages.showError(res.body.message);
            }
          }
          observer.next(res);
          observer.complete();
        }, (err: HttpErrorResponse) => {
          this.messages.getErrorMessage(observer, err);
        })
      }
    });
  }

  getUserPreferences = () => {
    const path = '/orgchart/preference/' + this.currentUserName;
    this.fetch(path, null, 'get');
  }

  private defaultHeaders = () => (
    new HttpHeaders({
      "X-XSRF-TOKEN": this.token,
      "Content-Type": "application/json"
    })
  )

  private defaultHeadersDev = () => (
    new HttpHeaders({
      "Authorization": "Basic c3BhZG1pbjphZG1pbg==",
      "Content-Type": "application/json"
    })
  )
}
