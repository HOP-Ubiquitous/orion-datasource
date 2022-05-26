import { QueryType } from './utils/query-type';
import { GrafanaUtils } from './utils/grafana-utils';
import { FIWAREScope } from './utils/fiware-scope';
import { FIWARETypeCollection } from './utils/fiware-type';
import { FIWAREEntity, FIWAREEntityCollection } from './utils/fiware-entity';
import { MetricQuery, MetricQueryType } from './utils/metric-query';
import { OrionDatasource } from './OrionDatasource';
import { TemplateSrv } from '@grafana/runtime';
import { MetricEditorQuery } from './types';
import { FiwareServicePathsCollection, FiwareServicesCollection } from './utils/fiware-scope-collection';

export class Datasource implements OrionDatasource {
  name: string;
  id: number;
  url: string;
  headers: any;
  orionPaginationLimit: number;
  fiwareService: string;
  fiwareServicePath: string;
  isHide: boolean;

  private static DEFAULT_SERVICE_HEADER = 'default';
  private static DEFAULT_SERVICE_PATH_HEADER = '/default';

  private static ORION_ADMIN_METRICS = '/admin/metrics';
  private static ORION_URL_ENTITIES = '/v2/entities';
  private static ORION_URL_TYPES = '/v2/types?options=values';
  private static ORION_URL_GET_VERSION = '/version';

  private static DEFAULT_TYPE_ALL_ENTITIES = 'All';
  private static DEFAULT_ATTRIBUTES = 'Default';
  private static DEFAULT_ALL_ATTRIBUTES = 'All';
  static DEFAULT_NAME_TIME_COLUMN = 'time';

  /** @ngInject */
  constructor(instanceSettings: any, private backendSrv: any, private templateSrv: TemplateSrv) {
    this.name = instanceSettings.name;
    this.url = instanceSettings.url;
    this.id = instanceSettings.id;
    this.isHide = false;
    this.headers = {};
    this.orionPaginationLimit = instanceSettings.jsonData.orionPaginationLimit;
    this.fiwareService = instanceSettings.jsonData.fiwareService || Datasource.DEFAULT_SERVICE_HEADER;
    this.fiwareServicePath = instanceSettings.jsonData.fiwareServicePath || Datasource.DEFAULT_SERVICE_PATH_HEADER;
  }

  private getDecoded(variable: string | undefined) {
    //@ts-ignore
    return this.templateSrv.replace(variable);
  }

  private getDecodedScopedVar(variable: string, scopedVars: any) {
    return this.templateSrv.replace(variable, scopedVars);
  }

  private doRequest(options: any) {
    return this.backendSrv.datasourceRequest(options);
  }

  private getQueryStringOrionLimit() {
    return `limit=${this.orionPaginationLimit}`;
  }

  query(options: any) {
    let self = this;
    let promises = [];
    let secondaryEntitiesTables: any[] = [];
    let queriesCount = options.targets.length;
    try {
      for (let i = queriesCount - 1; i >= 0; i--) {
        let selectedRequest = self.getDecodedScopedVar(options.targets[i].selectedRequest, options.scopedVars);

        let defaultFiwareService = options.targets[i].defaultFiwareService;
        let service = self.fiwareService;
        let servicePath = self.fiwareServicePath;
        if (!defaultFiwareService) {
          service = self.getDecodedScopedVar(options.targets[i].service, options.scopedVars);
          servicePath = self.getDecodedScopedVar(options.targets[i].servicePath, options.scopedVars);
        }

        let includeTime = options.targets[i].currentTimeColumn;

        let entityType = self.getDecodedScopedVar(options.targets[i].entityType, options.scopedVars);
        let entityId = self.getDecodedScopedVar(options.targets[i].entityId, options.scopedVars);
        let attributes = self.getDecodedScopedVar(options.targets[i].attributes, options.scopedVars);
        let queryFilter = self.getDecodedScopedVar(options.targets[i].queryFilter, options.scopedVars);

        let fiwareScope: FIWAREScope = new FIWAREScope(service, servicePath, entityType);

        let isHide = options.targets[i].hide;

        if (i > 0) {
          if (selectedRequest === QueryType.Entities && !isHide) {
            promises.push(
              self
                .getGrafanaTableEntities(fiwareScope, entityId, includeTime, attributes, queryFilter)
                .then(function (dataTable: any) {
                  promises.push(Promise.resolve(secondaryEntitiesTables.push(dataTable.data[0])));
                })
            );
          } else {
            console.log('Ignored secondary query');
          }
        } else {
          return Promise.all(promises).then(() => {
            let tableData: any;
            let secondaryTables: any[] = [];
            switch (selectedRequest) {
              case QueryType.Entities: {
                tableData = self.getGrafanaTableEntities(fiwareScope, entityId, includeTime, attributes, queryFilter);
                secondaryTables = secondaryEntitiesTables;
                break;
              }
            }

            return tableData.then(function (tableData: any) {
              if (isHide) {
                GrafanaUtils.setEmptyGrafanaTable(tableData);
              }
              secondaryTables.forEach(function (secondaryTable: any) {
                tableData.data.push(secondaryTable);
              });
              return tableData;
            });
          });
        }
      }
    } catch (e) {
      console.log('Errors with updates: ' + e);
      return e;
    }
  }

  findMetricsEntitiesGrafana(query: MetricEditorQuery) {
    let self = this;
    let service = self.fiwareService;
    let servicePath = self.fiwareServicePath;
    if (!query.defaultFiwareHeaders) {
      service = query.fiwareService;
      servicePath = query.fiwareServicePath;
    }
    let fiwareScope = new FIWAREScope(
      self.getDecoded(service),
      self.getDecoded(servicePath),
      self.getDecoded(query.entityType)
    );
    return self.getGrafanaListEntities(fiwareScope, '', Datasource.DEFAULT_ATTRIBUTES, '');
  }

  findMetricsAttributesGrafana(query: MetricEditorQuery, dashboardVariable: boolean) {
    let self = this;
    let service = self.fiwareService;
    let servicePath = self.fiwareServicePath;
    if (!query.defaultFiwareHeaders) {
      service = query.fiwareService;
      servicePath = query.fiwareServicePath;
    }
    return self.getGrafanaListEntityAttributes(
      new FIWAREScope(this.getDecoded(service), this.getDecoded(servicePath), this.getDecoded(query.entityType)),
      dashboardVariable
    );
  }

  findMetricsTypesGrafana(query: MetricEditorQuery) {
    let self = this;
    let service = self.fiwareService;
    let servicePath = self.fiwareServicePath;
    if (!query.defaultFiwareHeaders) {
      service = query.fiwareService;
      servicePath = query.fiwareServicePath;
    }
    let fiwareScope = new FIWAREScope(self.getDecoded(service), self.getDecoded(servicePath), undefined);
    return self.getGrafanaListTypes(fiwareScope);
  }

  private getGrafanaTableEntities(
    fiwareScope: FIWAREScope,
    entityId: string,
    includeTime: boolean,
    attributes: string,
    queryFilter: string
  ) {
    let self = this;
    let attributesArray: string[] = [];
    if (attributes !== Datasource.DEFAULT_ATTRIBUTES) {
      try {
        attributesArray = attributes.split(',');
      } catch (error) {
        attributesArray = [];
      }
    }
    let entitiesResponse = self.queryGetEntities(fiwareScope, entityId, attributes, queryFilter);
    return entitiesResponse.then(function (entitiesResponse: any) {
      let orionEntities = entitiesResponse.data;
      let fiwareEntityCollection = Datasource.getFiwareEntityCollection(fiwareScope, attributesArray, orionEntities);
      entitiesResponse.data = fiwareEntityCollection.getGrafanaTable(
        includeTime,
        attributes === Datasource.DEFAULT_ALL_ATTRIBUTES
      );
      return entitiesResponse;
    });
  }

  private getGrafanaListEntities(fiwareScope: FIWAREScope, entityId: string, attributes: string, queryFilter: string) {
    let self = this;
    let attributesArray: string[] = [];
    if (attributes !== Datasource.DEFAULT_ATTRIBUTES) {
      try {
        attributesArray = attributes.split(',');
      } catch (error) {
        attributesArray = [];
      }
    }
    let entitiesResponse = self.queryGetEntities(fiwareScope, entityId, attributes, queryFilter);
    return entitiesResponse.then(function (entitiesResponse: any) {
      let orionEntities = entitiesResponse.data;
      let fiwareEntityCollection = Datasource.getFiwareEntityCollection(fiwareScope, attributesArray, orionEntities);
      return fiwareEntityCollection.getGrafanaList();
    });
  }

  private queryGetEntities(fiwareScope: FIWAREScope, entityId: string, attributes: string, queryFilter: string) {
    let self = this;
    let url = self.url + Datasource.ORION_URL_ENTITIES;
    if (entityId === Datasource.DEFAULT_TYPE_ALL_ENTITIES) {
      entityId = '';
    }
    if (entityId !== undefined && entityId !== '') {
      url += '/' + entityId;
    }
    let queryParams = [];

    queryParams.push('options=dateModified');
    if (fiwareScope.type !== Datasource.DEFAULT_TYPE_ALL_ENTITIES) {
      queryParams.push('type=' + fiwareScope.type);
    }
    if (attributes !== Datasource.DEFAULT_ATTRIBUTES && attributes !== Datasource.DEFAULT_ALL_ATTRIBUTES) {
      queryParams.push('attrs=' + attributes);
    }
    if (queryFilter !== undefined && queryFilter !== '') {
      queryParams.push('q=' + queryFilter);
    }
    if (this.orionPaginationLimit !== undefined) {
      queryParams.push(this.getQueryStringOrionLimit());
    }
    if (queryParams.length > 0) {
      url += '?';
    }
    queryParams.forEach(function (param: string) {
      url += param + '&';
    });

    return self
      .doRequest({
        url: url,
        headers: FIWAREScope.getFiwareHeaders(fiwareScope.service, fiwareScope.servicePath),
        method: 'GET',
      })
      .then(
        function (entitiesResponse: any) {
          if (entitiesResponse.data === undefined) {
            entitiesResponse.data = [];
          } else if (entityId !== undefined && entityId !== '' && entityId !== Datasource.DEFAULT_TYPE_ALL_ENTITIES) {
            entitiesResponse.data = [entitiesResponse.data];
          }
          let collator = new Intl.Collator('es', {
            numeric: true,
            sensitivity: 'base',
          });
          entitiesResponse.data = entitiesResponse.data.sort((entityA: FIWAREEntity, entityB: FIWAREEntity) =>
            collator.compare(entityA.id, entityB.id)
          );
          return entitiesResponse;
        },
        function (errorResponse: any) {
          errorResponse.data = [];
          return errorResponse;
        }
      );
  }

  private static getFiwareEntityCollection(fiwareScope: FIWAREScope, attributes: string[], orionEntities: any) {
    return new FIWAREEntityCollection(fiwareScope.service, fiwareScope.servicePath, attributes, orionEntities);
  }

  private getGrafanaListTypes(fiwareScope: FIWAREScope) {
    let promiseTypesResponse = this.queryGetTypes(fiwareScope);
    return promiseTypesResponse.then(function (typesResponse: any) {
      let fiwareTypeCollection = new FIWARETypeCollection(
        fiwareScope.service,
        fiwareScope.servicePath,
        typesResponse.data
      );
      return fiwareTypeCollection.getGrafanaList();
    });
  }

  private queryGetTypes(fiwareScope: FIWAREScope) {
    let self = this;

    return self
      .doRequest({
        url: self.url + Datasource.ORION_URL_TYPES,
        headers: FIWAREScope.getFiwareHeaders(fiwareScope.service, fiwareScope.servicePath),
        method: 'GET',
      })
      .then(
        function (typesResponse: any) {
          return typesResponse;
        },
        function (errorResponse: any) {
          errorResponse.data = [];
          return errorResponse;
        }
      );
  }

  private getGrafanaListEntityAttributes(fiwareScope: FIWAREScope, dashboardVariable: boolean) {
    let self = this;
    if (fiwareScope.type === Datasource.DEFAULT_TYPE_ALL_ENTITIES) {
      if (dashboardVariable) {
        return Promise.resolve(GrafanaUtils.getGrafanaList(['location', 'latitude', 'longitude']));
      } else {
        return Promise.resolve(GrafanaUtils.getGrafanaList(['location,latitude,longitude']));
      }
    }
    let promiseEntitiesReponse = self.queryGetEntities(fiwareScope, '', Datasource.DEFAULT_ALL_ATTRIBUTES, '');
    return promiseEntitiesReponse.then(function (entitiesResponse: any) {
      let orionEntities = entitiesResponse.data;
      let fiwareEntityCollection = Datasource.getFiwareEntityCollection(fiwareScope, [], orionEntities);
      if (!fiwareEntityCollection.isEmpty()) {
        let columnArray = fiwareEntityCollection.getColumnHeaders(false);
        if (dashboardVariable) {
          return GrafanaUtils.getGrafanaList(columnArray);
        } else {
          let columnString = '';
          columnArray.forEach(function (column: string) {
            columnString += column + ',';
          });
          columnString = columnString.substring(0, columnString.length - 1);
          return GrafanaUtils.getGrafanaList([columnString]);
        }
      } else {
        return GrafanaUtils.getGrafanaList([]);
      }
    });
  }

  private async getGrafanaListAttributeValue(
    fiwareScope: FIWAREScope,
    id: string,
    attribute: string,
    queryFilter: string
  ) {
    let self = this;
    let attributes = attribute.split(',');
    let fiwareEntityCollection: FIWAREEntityCollection = await self.queryAttributeValuesCollection(
      fiwareScope,
      id,
      attribute,
      queryFilter
    );
    if (fiwareEntityCollection.isEmpty()) {
      return GrafanaUtils.getGrafanaList([]);
    }
    return fiwareEntityCollection.getAttributeValuesGrafanaList(attributes[0]);
  }

  private async getGrafanaListAttributeValueAsMapping(
    fiwareScope: FIWAREScope,
    id: string,
    attribute: string,
    queryFilter: string
  ) {
    let self = this;
    let attributes = attribute.split(',');
    let fiwareEntityCollection: FIWAREEntityCollection = await self.queryAttributeValuesCollection(
      fiwareScope,
      id,
      attribute,
      queryFilter
    );
    if (fiwareEntityCollection.isEmpty()) {
      return GrafanaUtils.getGrafanaList([]);
    }
    return fiwareEntityCollection.getAttributeValuesGrafanaListMappingId(attributes[0]);
  }

  private async getGrafanaListAttributeValueAsList(
    fiwareScope: FIWAREScope,
    id: string,
    attribute: string,
    queryFilter: string
  ) {
    let self = this;
    let attributes = attribute.split(',');
    let fiwareEntityCollection: FIWAREEntityCollection = await self.queryAttributeValuesCollection(
      fiwareScope,
      id,
      attribute,
      queryFilter
    );
    if (fiwareEntityCollection.isEmpty()) {
      return GrafanaUtils.getGrafanaList([]);
    }
    return fiwareEntityCollection.getAttributeValueAsGrafanaList(attributes[0]);
  }

  private queryAttributeValuesCollection(fiwareScope: FIWAREScope, id: string, attribute: string, queryFilter: string) {
    let self = this;
    let attributes = attribute.split(',');
    let entitiesResponse = self.queryGetEntities(fiwareScope, id, attribute, queryFilter);
    return entitiesResponse.then(function (entitiesResponse: any) {
      let orionEntities = entitiesResponse.data;
      return new FIWAREEntityCollection(fiwareScope.service, fiwareScope.servicePath, attributes, orionEntities);
    });
  }

  getGrafanaListFiwareServices() {
    let promiseFiwareServicesResponse = this.queryGetAdminMetrics();
    return promiseFiwareServicesResponse.then(function (fiwareServicesResponse: any) {
      let fiwareServicesCollection = new FiwareServicesCollection(fiwareServicesResponse.data);
      return fiwareServicesCollection.getGrafanaList();
    });
  }

  getGrafanaListFiwareServicePaths(fiwareService: string) {
    let promiseFiwareServicePathsResponse = this.queryGetAdminMetrics();
    return promiseFiwareServicePathsResponse.then(function (fiwareServicePathsResponse: any) {
      let fiwareServicePathsCollection = new FiwareServicePathsCollection(
        fiwareService,
        fiwareServicePathsResponse.data
      );
      return fiwareServicePathsCollection.getGrafanaList();
    });
  }

  private queryGetAdminMetrics() {
    let self = this;

    return self
      .doRequest({
        url: self.url + Datasource.ORION_ADMIN_METRICS,
        headers: {},
        method: 'GET',
      })
      .then(
        function (typesResponse: any) {
          return typesResponse;
        },
        function (errorResponse: any) {
          errorResponse.data = [];
          return errorResponse;
        }
      );
  }

  metricFindQuery(query: any) {
    let self = this;
    let interpolated = self.templateSrv.replace(query, {});
    let metricQueryJSON: any = undefined;
    let metricQuery: MetricQuery | undefined = undefined;
    try {
      metricQueryJSON = JSON.parse(interpolated);
      metricQuery = MetricQuery.parseFromJSON(metricQueryJSON);
    } catch (e) {
      console.log('Legacy mode, there is a new metric query format');
    }

    if (metricQuery !== undefined) {
      if (!metricQuery.isComplete()) {
        throw new TypeError('Incomplete Query');
      }

      switch (metricQuery.request) {
        case MetricQueryType.Entities:
          return Promise.resolve(
            self.getGrafanaListEntities(
              metricQuery.fiwareScope,
              metricQuery.entityId,
              metricQuery.attributeName,
              metricQuery.queryFilter
            )
          );
        case MetricQueryType.Types:
          return Promise.resolve(self.getGrafanaListTypes(metricQuery.fiwareScope));
        case MetricQueryType.AttributeValue:
          return Promise.resolve(
            self.getGrafanaListAttributeValue(
              metricQuery.fiwareScope,
              metricQuery.entityId,
              metricQuery.attributeName,
              metricQuery.queryFilter
            )
          );
        case MetricQueryType.AttributeValueAsMapping:
          return Promise.resolve(
            self.getGrafanaListAttributeValueAsMapping(
              metricQuery.fiwareScope,
              metricQuery.entityId,
              metricQuery.attributeName,
              metricQuery.queryFilter
            )
          );
        case MetricQueryType.AttributeValueAsList:
          return Promise.resolve(
            self.getGrafanaListAttributeValueAsList(
              metricQuery.fiwareScope,
              metricQuery.entityId,
              metricQuery.attributeName,
              metricQuery.queryFilter
            )
          );
        case MetricQueryType.AttributeName:
          return Promise.resolve(self.getGrafanaListEntityAttributes(metricQuery.fiwareScope, true));
        case MetricQueryType.FiwareServices:
          return Promise.resolve(self.getGrafanaListFiwareServices());
        case MetricQueryType.FiwareServicePaths:
          return Promise.resolve(self.getGrafanaListFiwareServicePaths(metricQuery.fiwareScope.service));
        default:
          return Promise.resolve([]);
      }
    } else {
      console.log('Error with metrics query');
      return Promise.resolve([]);
    }
  }

  testDatasource() {
    let self = this;
    return self
      .doRequest({
        url: self.url + Datasource.ORION_URL_GET_VERSION,
        method: 'GET',
      })
      .then(
        function (response: any) {
          if (response.status === 200) {
            let orionVersion = response.data['orion']['version'];
            return {
              status: 'success',
              message: 'Orion Datasource is OK, Version ' + orionVersion,
              title: 'Success',
            };
          } else {
            return { status: 'error', message: 'Data source /version is not OK', title: 'Error' };
          }
        },
        () => {
          return { status: 'error', message: 'Data source /version is not OK', title: 'Error' };
        }
      );
  }
}
