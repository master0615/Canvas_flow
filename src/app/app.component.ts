import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import * as shape from 'd3-shape';
import { Subject } from 'rxjs';
import chartGroups from './chartTypes';
import { countries, generateGraph } from './data';
import { Graph, Layout, ColaForceDirectedLayout, D3ForceDirectedLayout, Edge, Node } from './ngx-graph';
import { colorSets, id } from './ngx-graph/utils';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ContextMenuComponent } from 'ngx-contextmenu';


@Component({
  selector: 'app-root',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./app.component.scss'],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

  @ViewChild(ContextMenuComponent) public basicMenu: ContextMenuComponent;
  theme = 'dark';
  chartType = 'directed-graph';
  chartTypeGroups: any;
  chart: any;
  realTimeData: boolean = false;
  countrySet: any[];
  graph: Graph;

  view: any[];
  width: number = 700;
  height: number = 300;
  fitContainer: boolean = true;
  autoZoom: boolean = false;
  panOnZoom: boolean = true;
  enableZoom: boolean = true;
  autoCenter: boolean = false;

  // observables
  update$: Subject<any> = new Subject();
  center$: Subject<any> = new Subject();
  zoomToFit$: Subject<any> = new Subject();

  // options
  showLegend = false;
  orientation: string = 'LR'; // LR, RL, TB, BT
  source_nodes: Node[]=[];
  target_nodes: Node[]=[];

  orientations: any[] = [
    {
      label: 'Left to Right',
      value: 'LR'
    },
    {
      label: 'Right to Left',
      value: 'RL'
    },
    {
      label: 'Top to Bottom',
      value: 'TB'
    },
    {
      label: 'Bottom to Top',
      value: 'BT'
    }
  ];

  layoutId: string = 'dagre';
  customLayout: Layout;
  layouts: any[] = [
    {
      label: 'Dagre',
      value: 'dagre',
    },
    {
      label: 'Dagre Nodes Only',
      value: 'dagreNodesOnly',
    },
    {
      label: 'Dagre Cluster',
      value: 'dagreCluster',
      isClustered: true,
    },
    {
      label: 'Cola Force Directed',
      value: 'colaForceDirected',
      customLayout: new ColaForceDirectedLayout(),
      isClustered: true,
    },
    {
      label: 'D3 Force Directed',
      value: 'd3ForceDirected',
      customLayout: new D3ForceDirectedLayout(),
    },
  ];

  // line interpolation
  curveType: string = 'Linear';
  curve: any = shape.curveLinear;
  interpolationTypes = [
    'Bundle',
    'Cardinal',
    'Catmull Rom',
    'Linear',
    'Monotone X',
    'Monotone Y',
    'Natural',
    'Step',
    'Step After',
    'Step Before'
  ];

  colorSchemes: any;
  colorScheme: any;
  schemeType: string = 'ordinal';
  selectedColorScheme: string;

  addNodeForm: FormGroup;
  editNodeForm: FormGroup;
  addLineForm: FormGroup;
  editLineForm: FormGroup;
  constructor() {
    Object.assign(this, {
      countrySet: countries,
      colorSchemes: colorSets,
      chartTypeGroups: chartGroups,
      graph: generateGraph(3)
    });

    this.setColorScheme('picnic');
    this.setInterpolationType('Bundle');
    this.getAvailableSourceNodes();
  }

  ngOnInit() {
		this.addNodeForm = new FormGroup({
			label			: new FormControl('', [Validators.required]),
			color		  : new FormControl('', [Validators.required]),
    }, []);
    
		this.addLineForm = new FormGroup({
			label			  : new FormControl('', [Validators.required]),
      source		  : new FormControl('', [Validators.required]),
      target      : new FormControl('', [Validators.required])  
    }, []);

    this.selectChart(this.chartType);

    setInterval(this.updateData.bind(this), 1000);

    if (!this.fitContainer) {
      this.applyDimensions();
    }
  }


  getAvailableSourceNodes() {
     this.source_nodes  = this.graph.nodes.filter(node=> 
          this.graph.edges && (this.graph.edges.filter(edge=>edge.source == node.id || edge.target == node.id).length != this.graph.nodes.length - 1));
  }
  getAvailableTargetNodes(source_id) {
    this.target_nodes = this.graph.nodes.filter(node=> {
      let edges = this.graph.edges.filter(edge=>edge.source==source_id);
      console.log(edges);
      return (edges.length == 0 || edges.findIndex(edge=>edge.target!=node.id) > -1) && node.id !=source_id;
    });
  }

  sourceNodeChange(event) {
    this.getAvailableTargetNodes(event.target.value);
  }

  deleteNode(event) {
    let sel_node = event.item;
    this.graph.nodes = this.graph.nodes.filter(node=> node != sel_node);
    this.graph.edges = this.graph.edges.filter(edge => edge.source != sel_node.id && edge.target != sel_node.id);
    this.getAvailableSourceNodes();
  }

  addNode() {
    if (this.addNodeForm.invalid) return;
    let formValue = this.addNodeForm.getRawValue();

    let new_node: any;
    new_node = {id: id(), label: formValue.label, data: {color: formValue.color}};
    this.graph.nodes.push(new_node);

    this.graph.nodes = [...this.graph.nodes];
    this.addNodeForm.reset();
    this.getAvailableSourceNodes();
  }

  addLine() {

    if (this.addLineForm.invalid) return;
    let formValue = this.addLineForm.getRawValue();

    let new_edge: any;
    new_edge = {id: id(), label: formValue.label, source: formValue.source, target: formValue.target};
    this.graph.edges.push(new_edge);
    this.graph.edges = [...this.graph.edges];
    this.graph.nodes = [...this.graph.nodes];

    console.log(this.graph.edges);
    this.addLineForm.reset();
  }

  updateData() {
    if (!this.realTimeData) {
      return;
    }

    const country = this.countrySet[Math.floor(Math.random() * this.countrySet.length)];
    const add = Math.random() < 0.7;
    const remove = Math.random() < 0.5;

    if (add) {
      // directed graph

      const hNode = {
        id: id(),
        label: country
      };

      this.graph.nodes.push(hNode);

      this.graph.edges.push({
        source: this.graph.nodes[Math.floor(Math.random() * (this.graph.nodes.length - 1))].id,
        target: hNode.id,
        label: 'on success'
      });

      this.graph.edges = [...this.graph.edges];
      this.graph.nodes = [...this.graph.nodes];
    }
  }

  applyDimensions() {
    this.view = [this.width, this.height];
  }

  toggleEnableZoom(enableZoom: boolean) {
    this.enableZoom = enableZoom;
  }

  toggleFitContainer(fitContainer: boolean, autoZoom: boolean, autoCenter: boolean): void {
    this.fitContainer = fitContainer;
    this.autoZoom = autoZoom;
    this.autoCenter = autoCenter;

    if (this.fitContainer) {
      this.view = undefined;
    } else {
      this.applyDimensions();
    }
  }

  selectChart(chartSelector) {
    this.chartType = chartSelector;

    for (const group of this.chartTypeGroups) {
      for (const chart of group.charts) {
        if (chart.selector === chartSelector) {
          this.chart = chart;
          return;
        }
      }
    }
  }

  select(data) {
    console.log('Item clicked', data);
  }

  setColorScheme(name) {
    this.selectedColorScheme = name;
    this.colorScheme = this.colorSchemes.find(s => s.name === name);
  }

  setInterpolationType(curveType) {
    this.curveType = curveType;
    if (curveType === 'Bundle') {
      this.curve = shape.curveBundle.beta(1);
    }
    if (curveType === 'Cardinal') {
      this.curve = shape.curveCardinal;
    }
    if (curveType === 'Catmull Rom') {
      this.curve = shape.curveCatmullRom;
    }
    if (curveType === 'Linear') {
      this.curve = shape.curveLinear;
    }
    if (curveType === 'Monotone X') {
      this.curve = shape.curveMonotoneX;
    }
    if (curveType === 'Monotone Y') {
      this.curve = shape.curveMonotoneY;
    }
    if (curveType === 'Natural') {
      this.curve = shape.curveNatural;
    }
    if (curveType === 'Step') {
      this.curve = shape.curveStep;
    }
    if (curveType === 'Step After') {
      this.curve = shape.curveStepAfter;
    }
    if (curveType === 'Step Before') {
      this.curve = shape.curveStepBefore;
    }

    console.log(this.curve);
  }

  onLayoutChange(layoutId: string) {
    const layout = this.layouts.find(layoutRef => layoutRef.value === layoutId);
    if (layout && layout.isClustered) {
      this.addClusters();
    } else {
      this.removeClusters();
    }
    if (layout) {
      this.customLayout = layout.customLayout;
    }
  }

  addClusters() {
    const subGroup = {
      id: id(),
      label: 'Subgroup',
      childNodeIds: [this.graph.nodes[2].id, this.graph.nodes[4].id],
    };
    this.graph.clusters = [{
      id: id(),
      label: 'Cluster',
      childNodeIds: [this.graph.nodes[0].id, subGroup.id],
    }, subGroup];
  }

  removeClusters() {
    this.graph.clusters = [];
  }

  onLegendLabelClick(entry) {
    console.log('Legend clicked', entry);
  }

  toggleExpand(node) {
    console.log('toggle expand', node);
  }

  updateChart() {
    this.update$.next(true);
  }

  zoomToFit() {
    this.zoomToFit$.next(true);
  }

  center() {
    this.center$.next(true);
  }

  get NodesJSON () {
    return JSON.stringify(this.graph.nodes, undefined, 4);
  }

  // set NodesJSON (v) {
  //   try{
  //     setTimeout(()=>{this.graph.nodes = JSON.parse(v);}, 0);
  //   }
  //   catch(e) {
  //     console.log('error occored while you were typing the JSON');
  //   };
  // }
}