import { ComponentFixture, TestBed } from '@angular/core/testing';

import { D3OrgChartComponent } from './d3-org-chart.component';

describe('D3OrgChartComponent', () => {
  let component: D3OrgChartComponent;
  let fixture: ComponentFixture<D3OrgChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ D3OrgChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(D3OrgChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
