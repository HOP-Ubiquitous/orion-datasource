import { GrafanaUtils } from './grafana-utils';

export class FIWARETypeCollection {
  types: string[] = [];

  constructor(service: string, servicePath: string, typeResponse: any) {
    let self = this;
    typeResponse.forEach(function (type: any) {
      self.types.push(type);
    });
  }

  getArray() {
    return this.types;
  }

  getGrafanaList() {
    return GrafanaUtils.getGrafanaList(this.getArray());
  }
}
