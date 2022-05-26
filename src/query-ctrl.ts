import { QueryType } from './utils/query-type';
import { MetricEditorQuery } from './types';

export class QueryCtrl {
  static templateUrl = 'partials/query-editor.html';

  target: any;
  panelCtrl: any;
  datasource: any;
  requests: any;

  constructor() {
    let self = this;
    self.target.hide = false;
    self.target.target = self.target.target || 'select metric';
    self.target.type = 'table'; // timeseries

    self.requests = Object.keys(QueryType);
    self.target.selectedRequest = self.target.selectedRequest || 'Entities';

    self.target.defaultFiwareService = self.target.defaultFiwareService || false;
    self.target.entityType = self.target.entityType || 'All';
    self.target.currentTimeColumn = self.target.currentTimeColumn || false;
    self.target.entityId = self.target.entityId || 'All';
    self.target.attributes = self.target.attributes || 'All';
    self.target.queryFilter = self.target.queryFilter || '';

    self.target.enableTypeSearch = self.target.enableTypeSearch || false;
    self.onChangeInternal();
  }

  findMetricsTypesGrafana() {
    let self = this;
    let query: MetricEditorQuery = {
      defaultFiwareHeaders: self.target.defaultFiwareService,
      fiwareService: self.target.service,
      fiwareServicePath: self.target.servicePath,
    };
    return self.datasource.findMetricsTypesGrafana(query).then(function (typesArray: any) {
      let options = typesArray;
      if (typesArray !== undefined) {
        options.push({ text: 'All', value: 'All' });
      } else {
        options = [
          { text: 'All', value: 'All' },
          { text: 'None', value: 'None' },
        ];
      }
      return options;
    });
  }

  findMetricsEntitiesGrafana() {
    let self = this;
    let query: MetricEditorQuery = {
      defaultFiwareHeaders: self.target.defaultFiwareService,
      fiwareService: self.target.service,
      fiwareServicePath: self.target.servicePath,
      entityType: self.target.entityType,
    };
    return self.datasource.findMetricsEntitiesGrafana(query).then(function (entityArray: any) {
      let options = entityArray;
      if (entityArray !== undefined) {
        options.push({ text: 'All', value: 'All' });
      } else {
        options = [
          { text: 'All', value: 'All' },
          { text: 'None', value: 'None' },
        ];
      }
      return options;
    });
  }

  findMetricsAttributesGrafana() {
    let self = this;
    let query: MetricEditorQuery = {
      defaultFiwareHeaders: self.target.defaultFiwareService,
      fiwareService: self.target.service,
      fiwareServicePath: self.target.servicePath,
      entityType: self.target.entityType,
    };
    return self.datasource.findMetricsAttributesGrafana(query, false).then(function (attributesArray: any) {
      let options = attributesArray;
      if (attributesArray !== undefined) {
        options.push({ text: 'Default', value: 'Default' }, { text: 'All', value: 'All' });
      } else {
        options = [
          { text: 'Default', value: 'Default' },
          { text: 'All', value: 'All' },
          { text: 'None', value: 'None' },
        ];
      }
      return options;
    });
  }

  reloadEntities() {
    this.onChangeInternal();
  }

  onChangeInternal() {
    this.panelCtrl.refresh();
  }
}
