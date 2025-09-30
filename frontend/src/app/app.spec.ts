import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { of } from 'rxjs';
import { ClipboardRealtimeService } from './services/clipboard-realtime.service';
import { ClipboardApiService } from './services/clipboard-api.service';
import { ClipboardItem } from './models/clipboard';

class ClipboardRealtimeServiceStub {
  private readonly statusSignal = () => true;

  connect() {
    return of<ClipboardItem>({
      id: 'stub',
      content: 'stub',
      format: 'markdown',
      source: 'stub',
      dayKey: '1970-01-01',
      createdAt: new Date().toISOString(),
    });
  }

  status() {
    return this.statusSignal;
  }
}

class ClipboardApiServiceStub {
  listDays() {
    return of([]);
  }

  listByDay() {
    return of([]);
  }

  create() {
    return of({
      id: 'stub',
      content: 'stub',
      format: 'markdown',
      source: 'stub',
      dayKey: '1970-01-01',
      createdAt: new Date().toISOString(),
    });
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        { provide: ClipboardRealtimeService, useClass: ClipboardRealtimeServiceStub },
        { provide: ClipboardApiService, useClass: ClipboardApiServiceStub },
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Clipboard colaborativo');
  });
});
