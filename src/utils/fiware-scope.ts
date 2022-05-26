export class FIWAREScope {
  private static ORION_SERVICE_HEADER = 'fiware-service';
  private static ORION_SERVICEPATH_HEADER = 'fiware-servicepath';

  constructor(public service: any, public servicePath: any, public type: any) {
    this.service = service;
    this.servicePath = servicePath;
    this.type = type;
  }

  isCompleted() {
    return this.service !== null && this.servicePath !== null && this.type !== null && this.type !== 'empty';
  }

  static getFiwareHeaders(service: string, servicePath: string) {
    let headers: any = {};
    headers[FIWAREScope.ORION_SERVICE_HEADER] = service;
    headers[FIWAREScope.ORION_SERVICEPATH_HEADER] = servicePath;
    headers['Content-Type'] = '';
    return headers;
  }
}
