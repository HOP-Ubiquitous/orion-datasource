import { GrafanaUtils } from './grafana-utils';

export class FiwareServicesCollection {
  fiwareServices: string[] = [];

  constructor(fiwareServicesResponse: any) {
    let self = this;
    for (const [key] of Object.entries(fiwareServicesResponse.services)) {
      self.fiwareServices.push(key);
    }
  }

  getArray() {
    return this.fiwareServices;
  }

  getGrafanaList() {
    return GrafanaUtils.getGrafanaList(this.getArray());
  }
}

export class FiwareServicePathsCollection {
  fiwareServicePaths: string[] = [];

  constructor(public fiwareService: string, fiwareServicePathsResponse: any) {
    let self = this;
    self.fiwareService = fiwareService;
    for (const [key] of Object.entries(fiwareServicePathsResponse.services[self.fiwareService].subservs)) {
      self.fiwareServicePaths.push('/' + key);
    }
  }

  getArray() {
    return this.fiwareServicePaths;
  }

  getGrafanaList() {
    return GrafanaUtils.getGrafanaList(this.getArray());
  }
}
