import { Component, OnInit, OnChanges, Input, ViewChild, ElementRef } from '@angular/core';
import { OrgChart } from 'd3-org-chart';
import { FormControl, UntypedFormBuilder } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { DataService } from 'src/app/services/data/data.service';
import { environment } from './../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { NodeDetailsComponent } from '../node-details/node-details.component';
import { JoyrideService } from "ngx-joyride";
import { jsPDF } from "jspdf";
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from "@ngx-translate/core";

export interface Identity {
  name: string;
  displayName: string;
  id: string;
}

export interface Workgroup {
  name: string;
  displayName: string;
  id: string;
}

export interface Bundle {
  name: string;
  displayName: string;
  id: string;
}

export interface HighlightFilter {
  assignedRoles: Bundle[];
  detectedRoles: Bundle[];
  workgroups: Identity[];
  [key: string]: Identity[] | Bundle[];
}

export interface DisplayFilter {
  [key: string]: boolean;
}

@Component({
  selector: 'app-d3-org-chart',
  templateUrl: './d3-org-chart.component.html',
  styleUrls: ['./d3-org-chart.component.css']
})
export class D3OrgChartComponent implements OnInit {
  chart: any;
  myIdentityControl = new FormControl<string | Identity>('');
  myBundleControl = new FormControl<string | Bundle>('');
  myBundle2Control = new FormControl<string | Bundle>('');
  myWorkgroupControl = new FormControl<string | Workgroup>('');
  identityOptions: Identity[] = [];
  bundleOptions: Identity[] = [];
  workgroupOptions: Workgroup[] = []; 
  data: any[] = [];
  filteredData: any[] = [];
  ancestors: any[] = [];
  selected: Identity | undefined;
  nodePointer: string | undefined;
  compact: number = 0;
  index: number = 0;
  orgChartPluginGuideTourInactive: boolean = false;
  highlightFilter: HighlightFilter = {assignedRoles: [], detectedRoles: [], workgroups: []};
  filterKeys: string[] = ['assignedRoles', 'detectedRoles', 'workgroups'];
  panelOpenState = false;
  connections: any[] | undefined;
  connDisplayState: 'Show' | 'Clear' = 'Show';
  markRootDisplayState: 'Mark' | 'Clear' = 'Mark';
  highlightFilterExpanded: boolean = false;
  displayFilter: DisplayFilter = {};
  nodeTypes: any = {};

  constructor(private translate: TranslateService,
     private dataService : DataService,
     public dialog: MatDialog,
     private readonly joyrideService: JoyrideService,
     private route: ActivatedRoute) {
        translate.setDefaultLang('en');
        const browserLang = translate.getBrowserLang();
        if (browserLang) {
          translate.use(browserLang);
        }
     }
  
  ngOnInit(): void {
    this.initIdentityOptions();
    this.getIdentityOptions('');
    this.initFilterOptions();
    this.getBundleOptions('');
    this.disableConsoleInProduction();
    this.getUserPreferences();
    if (environment.production) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('id')) {
        const _id = params.get('id')?.slice(0, -1); // remove last slash 
        if (_id) {
          this.selected = {id: _id, name: _id, displayName: _id};
          this.getOrgChart();
        }
      }
    } else {
      this.route.paramMap.subscribe(params => {
        if (params.has('id')) {
          const _id = params.get('id');
          console.log(_id);
          if (_id) {
            this.selected = {id: _id, name: _id, displayName: _id};
            this.getOrgChart();
          }
        } else {
          console.log('No parameters');
        }
      });
    }
    
  }

  private initIdentityOptions = () => {
    this.myIdentityControl.valueChanges
      .pipe(debounceTime(500))
      .subscribe(input => {
        if (typeof input === "string" && input && input.length) {
          this.selected = undefined;
          this.getIdentityOptions(input);
        } else {
          if (this.myIdentityControl.value instanceof Object) {
            this.selected = this.myIdentityControl.value;
          }
        }
    });
  }

  private initFilterOptions = () => {
    this.myBundleControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe(input => {
        if (typeof input === "string" && input && input.length) {
          this.getBundleOptions(input);
          console.log(this.bundleOptions);
        } else {
          if (this.myBundleControl.value instanceof Object) {
            if (this.highlightFilter.assignedRoles.includes(this.myBundleControl.value) === false) {
              this.highlightFilter.assignedRoles.push(this.myBundleControl.value);
            }
            this.myBundleControl.setValue('');
          }
        }
      });
    this.myBundle2Control.valueChanges
      .pipe(debounceTime(300))
      .subscribe(input => {
        if (typeof input === "string" && input && input.length) {
          this.getBundleOptions(input);
          console.log(this.bundleOptions);
        } else {
          if (this.myBundle2Control.value instanceof Object) {
            if (this.highlightFilter.detectedRoles.includes(this.myBundle2Control.value) === false) {
              this.highlightFilter.detectedRoles.push(this.myBundle2Control.value);
            }
            this.myBundle2Control.setValue('');
          }
        }
      });
    this.myWorkgroupControl.valueChanges
      .pipe(debounceTime(500))
      .subscribe(input => {
        if (typeof input === "string" && input && input.length) {
          this.getWorkgroupOptions(input);
          console.log(this.workgroupOptions);
        } else {
          if (this.myWorkgroupControl.value instanceof Object) {
            if (this.highlightFilter.workgroups.includes(this.myWorkgroupControl.value) === false) {
              this.highlightFilter.workgroups.push(this.myWorkgroupControl.value);
            }
            this.myWorkgroupControl.setValue('');
          }
        }
    });
  }

  private getUserPreferences = () => {
    const path = '/orgchart/preference/' + this.dataService.currentUserName;
    this.dataService.fetch(path).subscribe(res => {
      if (res && res.body) {
        if (res.body.preference) {
          console.log("User Preferences: ");
          console.log(res.body.preference);
          this.orgChartPluginGuideTourInactive = res.body.preference?.orgChartPluginGuideTourInactive;
          if (!this.orgChartPluginGuideTourInactive) {
            this.startJoyTour1();
          }
        }
        if (res.body.nodeTypes) {
          this.nodeTypes = res.body.nodeTypes;
          this.initDisplayFilter();
        }
      }
    });
  }

  private setUserPreferences = (disableGuideTour: boolean) => {
    const path = '/orgchart/preference/' + this.dataService.currentUserName;
    this.dataService.fetch(path, {'orgChartPluginGuideTourInactive': disableGuideTour}, 'post').subscribe(res => {
      console.log("setUserPreferences:" + res.statusCode);
    });
  }

  private getIdentityOptions = (queryStr: string) => {
    console.log('Retrieving data for query: ' + queryStr);
    const filter = { query: queryStr, limit: 10, extraParams: { context: "Global", suggestId: "IncludeWorkGroups"}};
    const path = '/ui/rest/suggest/object/sailpoint.object.Identity';
    this.dataService.fetchSuggest(path, filter).subscribe(res => {
      if (res && res.objects) {
        const items = res.objects.map((obj:any) => {
          return { name: obj.name, displayName: obj.displayableName, id: obj.id }
        })
        this.identityOptions = items;
        console.log('getIdentityOptions:' + this.identityOptions.length);
      }
    });
  }

  private getWorkgroupOptions = (queryStr: string) => {
    console.log('Retrieving data for query: ' + queryStr);
    const filter = { query: queryStr, limit: 10, extraParams: { context: "Global", suggestId: "OnlyWorkgroups"}};
    const path = '/ui/rest/suggest/object/sailpoint.object.Identity';
    this.dataService.fetchSuggest(path, filter).subscribe(res => {
      if (res && res.objects) {
        const items = res.objects.map((obj:any) => {
          return { name: obj.name, displayName: obj.displayableName, id: obj.id }
        })
        this.workgroupOptions = items;
        console.log('getWorkgroupOptions:' + this.workgroupOptions.length);
      }
    });
  }

  private getBundleOptions = (queryStr: string) => {
    console.log('Retrieving data for query: ' + queryStr);
    const filter = { query: queryStr, limit: 10};
    const path = '/ui/rest/suggest/object/sailpoint.object.Bundle';
    this.dataService.fetchSuggest(path, filter).subscribe(res => {
      if (res && res.objects) {
        const items = res.objects.map((obj:any) => {
          return { name: obj.name, displayName: obj.displayableName, id: obj.id }
        })
        this.bundleOptions = items;
        console.log('getBundleOptions:' + this.bundleOptions.length);
        console.log(this.bundleOptions);
      }
    });
  }

  getOrgChart = () => {
    if (this.data.length !== 0) {
      this.data = [];
    }
    this.nodePointer = (' ' + this.selected?.id).slice(1);
    const path = `/orgchart/${this.nodePointer}`;
    this.dataService.fetch(path).subscribe(res => {
      if (res && res.body && res.body.nodes) {
        this.data = res.body.nodes;
        console.log("getOrgChart, data: ");
        console.log(this.data);
        this.updateChart();
        console.log(this.nodePointer);
        if (this.nodePointer !== undefined) {
          this.mark(this.nodePointer);
          this.setAncestors(this.nodePointer);
          this.expandAll();
        }
        if (!this.orgChartPluginGuideTourInactive) {
          this.startJoyTour2();
        }
      }
    }); 
  }

  toggleConnections = () => {
    if (this.connDisplayState === 'Show') {
      const path = `/orgchart/connections`;
      const allNodeIds = this.data.map((node) => {
        return node.id;
      });
      this.dataService.fetch(path, {'allNodeIds': allNodeIds}, 'post').subscribe(res => {
        if (res && res.body && res.body.connections) {
          console.log("Connections: ");
          console.log(res.body.connections);
          this.connections = res.body.connections;
          this.chart.connections(this.connections).render();
        }
      });
      this.connDisplayState = 'Clear';
    } else {
      this.connections = [];
      this.chart.connections(this.connections).render();
      this.connDisplayState = 'Show';
    }
  }

  getManages = (id: string) => {
    const path = `/orgchart/manages/${id}`;
    this.dataService.fetch(path).subscribe(res => {
      if (res && res.body && res.body.nodes) {
        this.data = this.data.concat(res.body.nodes);
        console.log("getManages, data: ");
        console.log(this.data);
        this.removeDuplicates();
        this.updateChart();
        this.expandAll();
        this.initDisplayFilter();
      }
    });
  }

  getDetails = () => {
    console.log("Node Pointer: " + this.nodePointer);
    let nodeObj = this.data.find((node) => {
      console.log("Node Id: " + node.id);
      return node.id === this.nodePointer;
    });
    console.log(nodeObj);
    const path = `/orgchart/details/${nodeObj.type}/${nodeObj.id}`;
    this.dataService.fetch(path).subscribe(res => {
      if (res && res.body && res.body.details) {
        console.log("Details: ");
        console.log(res.body.details); 
        this.openNodeDetailDailog(nodeObj, res.body.details);     
      }
    });
  }

  removeDuplicates = () => {
    this.data = this.data.filter((element, index, array) =>
      index === array.findIndex((t) => (
        t.id === element.id
      ))
    )
    console.log("removeDuplicates, data: ");
    console.log(this.data); 
  }

  displayFn = (obj: Identity | Bundle): string => {
    return obj && obj.displayName ? obj.displayName : obj.name;
  }

  ngAfterViewInit() {
    this.updateChart();
  }

  updateChart = () => {
    if (!this.data) {
      return;
    }
    this.chart = new OrgChart()
      .container('.chart-container')
      .data(this.data)
      .nodeWidth((d) => 300)
      .initialZoom(0.7)
      .nodeHeight((d) => 240)
      .childrenMargin((d) => 40)
      .compactMarginBetween((d) => 15)
      .compactMarginPair((d) => 80)
      .onNodeClick((d) => {
        if (typeof d === 'string') {
          this.nodePointer = d;
          this.chart.clearHighlighting();
          this.mark(d);
          if (d !== this.selected?.id) {
            this.getManages(d);
            this.setAncestors(d);
          }
        }
      })
      .nodeContent(function (d: any, i: any, arr: any, state: any) {
        const defaultIcon = 'data:image/png;base64,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';

        const workgroupIcon = 'data:image/png;base64,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';

        var iconImgDiv: string = `<img src="${defaultIcon}" style="margin-top:-30px;margin-left:${d.width / 2 - 56}px;border-radius:100px;width:60px;height:60px;"/>`;
        if (d.data.identityIconImgAttribute) {
          if (d.data[d.data.identityIconImgAttribute]) {
            iconImgDiv = `<img src="${d.data[d.data.identityIconImgAttribute]}" style="margin-top:-30px;margin-left:${d.width / 2 - 56}px;border-radius:100px;width:60px;height:60px;"/>`;
          }
        } else if (d.data.type === 'workgroup') {
          iconImgDiv = `<img src="${workgroupIcon}" style="margin-top:-30px;margin-left:${d.width / 2 - 36}px;border-radius:100px;width:60px;height:60px;"/>`;
        }

        // Custom Attributes
        var customAttrsDiv: string = '';
        if (d.data.attributes) {
          for (let attr of d.data.attributes) {
            customAttrsDiv += `<div style="color:#404040;font-size:16px;margin-top:4px"> ${d.data[attr]} </div>`;
          }
        }
        // Workgroup Members
        var workgroupMemberCountDiv: string = '';
        if (d.data.type === 'workgroup') {
          workgroupMemberCountDiv += `<div> Members:  ${d.data.memberCount} 👤</div>`;
        } else {
          workgroupMemberCountDiv += `<div> Workgroups:  ${d.data.membershipCount} 👥</div>`;
        }
        // Status 
        var status = ''; 
        if (d.data.type !== 'workgroup') {
          if (d.data.inactive === true) {
            status = String.fromCodePoint(0x1F534); // 🔴
          } else {
            status = String.fromCodePoint(0x1F7E2); // 🟢
          }
        }
        var badgeSpan = '';
        if (d.data.policyViolationsCount && d.data.policyViolationsCount > 0) {
          badgeSpan = `<span style="display: block;` + 
            `position: absolute;` + 
            `top: 25px;` + 
            `right: 3px;` + 
            `line-height: 16px;` + 
            `height: 16px;` + 
            `padding: 0 5px;` + 
            `font-family: Arial, sans-serif;` + 
            `color: white;` + 
            `text-shadow: 0 1px rgba(black, .25);` + 
            `border: 1px solid;` + 
            `border-radius: 10px;` + 
            `background: #F70D1A;` + 
            `border-color: darken(#F70D1A, 20%);">` + 
            d.data.policyViolationsCount +
            `</span>`;
        }
        return `
          <div style="padding-top:30px;background-color:none;margin-left:1px;height:${d.height}px;border-radius:2px;overflow:visible;">`+ 
            badgeSpan +
            `<!-- image icon -->
            <div id="${d.data.id}" style="height:${d.height - 32}px;padding-top:0px;background-color:white;border:1px solid lightgray;">` +
              iconImgDiv
              + `<div style="margin-right:10px;margin-top:15px;float:left">` + 
              status 
              + `</div>
              <!-- ID -->
              <div style="margin-right:10px;margin-top:15px;float:right">
                ${d.data.name}
              </div>
              <div style="margin-top:-30px;background-color:${d.data.colorCode};height:10px;width:${d.width - 2}px;border-radius:1px">
              </div>
              <div style="padding:20px; padding-top:35px;text-align:center">
                <div style="color:#111672;font-size:16px;font-weight:bold"> 
                  ${d.data.displayName} 
                </div>` +
                customAttrsDiv
                + `<div style="display:flex;justify-content:space-between;padding-left:15px;padding-right:15px;">
                  <div> Manages:  ${d.data.managesCount} 👤</div> ` +
                // Disable oversee, as 
                // <div> Oversees: ${d.data._totalSubordinates} 👤</div> ` +
                workgroupMemberCountDiv 
                + `</div>
              </div> 
            </div>
          </div>
        `;
      })
      .render();
      this.initDisplayFilter();
  }

  // Action Buttons

  fit = () => {
    this.chart.fit();
  }

  mark = (id: string) => {
    this.chart.setHighlighted(id).render().fit();
  }

  markRoot = () => {
    if (this.markRootDisplayState === 'Mark') {
      this.chart.setUpToTheRootHighlighted(this.nodePointer).render().fit();
      this.markRootDisplayState = 'Clear'
    } else {
      this.markRootDisplayState = 'Clear';
      this.chart.clearHighlighting();
      if (this.nodePointer) {
        this.mark(this.nodePointer);
      }
      this.markRootDisplayState = 'Mark'
    }
  }

  expandAll = () => {
    this.chart.expandAll();
  }

  collapseAll = () => {
    this.chart.collapseAll();
  }

  compactDisplay = () => {
    this.chart.compact(!!(this.compact++%2)).render().fit()
  }

  swapDirection = () => {
    this.chart.layout(["right","bottom","left","top"][this.index++%4]).render().fit()
  }

  downloadPDF = () => {
    this.chart.exportImg({
      save: false,
      onLoad: (base64: string) => {
        var pdf = new jsPDF();
        var img = new Image();
        img.src = base64;
        img.onload = function () {
          pdf.addImage(
            img,
            'JPEG',
            5,
            5,
            595 / 3,
            ((img.height / img.width) * 595) / 3
          );
          pdf.save('chart.pdf');
        };
      },
    });
  }

  // Node Details

  openNodeDetailDailog = (nodeObj: any, nodeDetails: AnalyserOptions) => {
    this.dialog.open(NodeDetailsComponent, {
      data: {
        nodeObj: nodeObj,
        nodeDetails: nodeDetails
      },
    });
  }

  analyseFilters = () => {
    console.log("HighlightFilter: ");
    console.log(this.highlightFilter);
    this.data.forEach((nodeObj) => {
      let highlighted: boolean = false;
      let boolArray: boolean[] = [];
      for (let attribute of this.filterKeys) {
        if (this.highlightFilter[attribute]?.length !== 0) {
          if (this.multiIncludes(nodeObj, attribute, this.highlightFilter[attribute])) {
            boolArray.push(true);
          } else {
            boolArray.push(false);
          }
        }
      }
      var temp = undefined;
      for (var i = 0 ; i < boolArray.length ; i++) {
        if (temp === undefined) {
          temp = boolArray[i];
        } else {
          temp = temp && boolArray[i];
        }
      }
      if (temp !== undefined) {
        highlighted = temp;
      }
      this.highlightNode(nodeObj.id, highlighted);
    });
  }

  private multiIncludes = (node: any, attr: string, values: Bundle[]): boolean => {
    return values.every((value) => {
      return node[attr]?.includes(value.id);
    });
  }

  highlightNode = (id: string, reset: boolean) => {
    const div = document.getElementById(id);
    if (div !== null) {
      if (reset) {
        div.style["boxShadow"] = "0px 0px 15px 2px red";
      } else {
        div.style["boxShadow"] = "";
      }
    }
  }

  removeHightedAssignedRole = (removeObj: Bundle, attribute: 'assignedRoles' | 'detectedRoles' | 'workgroups') => {
    let index = this.highlightFilter[attribute].indexOf(removeObj);
    if (index !== -1) {
      this.highlightFilter[attribute].splice(index);
    }
  }

  initDisplayFilter = () => {
    Object.keys(this.nodeTypes).forEach(key => {
      this.displayFilter[key] = true;
    });
  }

  filterNodes = () => {
    Object.keys(this.displayFilter).forEach(type => {
      console.log(type);
      if (this.displayFilter[type] === false) {
        console.log(this.displayFilter[type]);
        this.data.forEach((nodeObj) => {
          if (nodeObj.type === type ) { 
            if (!this.ancestors?.includes(nodeObj.id) && this.nodePointer !== nodeObj.id ) { // protect ancestors of current select node
              this.filteredData.push(nodeObj);
              this.chart.removeNode(nodeObj.id);
              console.log("Remove node: " + nodeObj.id);
            }
          }
        });
      }
    });
  }

  toggleDisplayFilterChange = (type: string) => {
    if (this.displayFilter[type] === true) {
      this.displayFilter[type] = false;
    } else {
      this.displayFilter[type] = true;
      // Clear filter flags 
      this.data.forEach(obj => {
        if (obj._filteredOut) {
          obj._filteredOut = false;
        }
        if (obj._filtered) {
          obj._filtered = false;
        }
      })
      this.chart.data(this.data); 
    }
    this.filterNodes();
    this.chart.render();
  }

  setAncestors = (id: string) => {
    const attrs = this.chart.getChartState();
    const node = attrs.allNodes.filter((d: { data: any; }) => attrs.nodeId(d.data) === id)[0];
    this.ancestors = node?.ancestors().map((obj: { id: any; }) => obj.id);
    console.log(this.ancestors);
  }

  startJoyTour1 = () => {
    this.joyrideService.startTour(
      { steps: ['searchBar'] } // Your steps order
    );
  }

  startJoyTour2 = () => {
    this.joyrideService.startTour(
      { steps: ['action-buttons', 'action-buttons-fitScreen', 'action-buttons-compact',
        'action-buttons-markRoot', 'action-buttons-details', 'action-buttons-swapDirection', 
        'action-buttons-collapseAll', 'action-buttons-expandAll', 'action-buttons-connections', 'action-buttons-downloadPDF', 'highlightFilter'],
        showPrevButton: false}
    ).subscribe(
      (step) => {
        if (step.name === 'action-buttons-fitScreen') {
          this.fit();
        } else if (step.name === 'action-buttons-compact') {
          this.compactDisplay();
        } else if (step.name === 'action-buttons-markRoot') {
          this.markRoot();
        } else if (step.name === 'action-buttons-swapDirection') {
          this.swapDirection();
        } else if (step.name === 'action-buttons-collapseAll') {
          this.collapseAll();
        } else if (step.name === 'action-buttons-expandAll') {
          this.expandAll();
        } else if (step.name === 'action-buttons-connections') {
          this.toggleConnections();
        } else if (step.name === 'action-buttons-downloadPDF') {
          // Open it first as prepation.
          this.highlightFilterExpanded = true;
        }
      },
      (error) => {
        console.error(error);
      },
      () => {
        this.highlightFilterExpanded = false;
        this.updateChart();
        this.markRoot();
        this.toggleConnections();
        this.fit();
        this.setUserPreferences(true); // Disable Tour Guide
      }
    );
  }

  help = () => {
    if (this.nodePointer === undefined) {
      this.startJoyTour1();
    } else {
      this.startJoyTour2();
    }
  }

  disableConsoleInProduction(): void {
    if (environment.production) {
      // 🚨 Console output is disabled on production!
      //console.log = function (): void { };
      //console.debug = function (): void { };
      //console.warn = function (): void { };
      //console.info = function (): void { };
    }
  }
}
