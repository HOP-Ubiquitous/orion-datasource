import { MetricEditorQuery } from './types';

export interface OrionDatasource {
  query(options: any): any;

  findMetricsEntitiesGrafana(query: MetricEditorQuery): any[];

  findMetricsAttributesGrafana(query: MetricEditorQuery, dashboardVariable: boolean): Promise<any[]>;

  findMetricsTypesGrafana(query: MetricEditorQuery): any[];

  metricFindQuery(query: any): Promise<any[]>;

  testDatasource(): any;
}
