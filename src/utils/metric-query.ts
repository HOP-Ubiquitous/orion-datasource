import { FIWAREScope } from './fiware-scope';

export enum MetricQueryType {
  Entities = 'Entities',
  Types = 'Types',
  AttributeValue = 'AttributeValue',
  AttributeValueAsList = 'AttributeValueAsList',
  AttributeName = 'AttributeName',
  FiwareServices = 'FiwareServices',
  FiwareServicePaths = 'FiwareServicePaths',
  AttributeValueAsMapping = 'AttributeValueAsMapping',
}

export class MetricQuery {
  request: MetricQueryType | undefined;
  fiwareScope: FIWAREScope;
  entityId: string;
  attributeName: string;
  queryFilter: string;

  private static DEFAULT_ALL_VALUE = 'All';

  constructor();
  constructor(
    request?: MetricQueryType,
    service?: string,
    servicePath?: string,
    type?: string,
    entityId?: string,
    attributeName?: string,
    queryFilter?: string
  ) {
    this.request = request;
    this.fiwareScope = new FIWAREScope(service, servicePath, type);
    this.entityId = MetricQuery.DEFAULT_ALL_VALUE;
    if (entityId !== undefined) {
      this.entityId = entityId;
    }
    this.attributeName = MetricQuery.DEFAULT_ALL_VALUE;
    if (attributeName !== undefined) {
      this.attributeName = attributeName;
    }
    this.queryFilter = '';
    if (queryFilter !== undefined) {
      this.queryFilter = queryFilter;
    }
  }

  isComplete() {
    return this.request !== undefined && this.fiwareScope !== undefined && this.fiwareScope.isCompleted();
  }

  static parseFromJSON(json: any) {
    let metricQuery = new MetricQuery();
    metricQuery.request = json.request;
    if (json.fiwareScope === undefined) {
      metricQuery.fiwareScope = new FIWAREScope(undefined, undefined, undefined);
    } else {
      metricQuery.fiwareScope = new FIWAREScope(
        json.fiwareScope.service,
        json.fiwareScope.servicePath,
        json.fiwareScope.type
      );
    }
    if (json.entityId !== undefined) {
      metricQuery.entityId = json.entityId;
    }
    if (json.attributeName !== undefined) {
      metricQuery.attributeName = json.attributeName;
    }
    if (json.queryFilter !== undefined) {
      metricQuery.queryFilter = json.queryFilter;
    }
    return metricQuery;
  }

  toShortString() {
    return 'simple';
  }
}
