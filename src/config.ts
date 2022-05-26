export class Config {
  static templateUrl = 'partials/config.html';

  current: any;
  pageReady: boolean;
  version: string | number;

  constructor($scope: any, $injector: any, private $window: any) {
    this.pageReady = false;
    this.version = '';
    if (this.current.id) {
      this.current.jsonData.url = this.current.url;
    } else {
      this.current = {
        type: 'orion-datasource',
        access: 'proxy',
      };
    }
    this.setGrafanaVersion(this.$window);
    this.pageReady = true;

    $scope.$watch('ctrl.current', () => {
      this.setUrl();
    });
  }

  setGrafanaVersion(window: any) {
    let _v;
    try {
      _v = window.grafanaBootData.settings.buildInfo.version.split('.')[0];
    } catch (e) {
      console.error(e);
      _v = 5;
    }
    this.version = _v;
  }

  setUrl() {
    this.current.jsonData.url = this.current.url;
  }
}
