import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor(private toastr: ToastrService) {}

  showSuccess = (text: string, title: string = "Success", timeOut: number = 5000) => {
    this.toastr.success(text, title, { timeOut });
  }

  showInfo = (text: string, title: string = "Info", timeOut: number = 5000) => {
    this.toastr.info(text, title, { timeOut });
  }

  showWarning = (text: string, title: string = "Warn", timeOut: number = 5000) => {
    this.toastr.warning(text, title, { timeOut });
  }

  showError = (text: string, title: string = "Error", timeOut: number = 5000) => {
    this.toastr.error(text, title, { timeOut });
  }

  getErrorMessage = (observer: Observer<any>, err: (HttpErrorResponse | any)) => {
    let msg = err.message || err["statusText"];
    if (err.error) {
      msg = err.error.message + "[" + err.error.quickKey + "]";
    }

    if (msg.startsWith("undefined")) msg = "unbekannter Fehler";
    this.showError(err.message , err.name);

    observer.error({ok: false, error: msg});
  }
}
