import { FIWAREScope } from './fiware-scope';
import { GrafanaUtils } from './grafana-utils';

export class FIWAREEntity extends FIWAREScope {
  static DEFAULT_NAME_TIME_COLUMN = 'time';

  constructor(
    public service: string,
    public servicePath: string,
    public type: string,
    public id: string,
    public attributes: any,
    public entityJson?: any
  ) {
    super(service, servicePath, type);
    this.id = id;
    this.attributes = attributes;
    this.entityJson = entityJson;
  }

  static parseFromJSON(service: string, servicePath: string, entityJson: any) {
    let attributes: any = {};
    // @ts-ignore
    Object.entries(entityJson).forEach(function (attribute: any) {
      if (attributes[FIWAREEntity.DEFAULT_NAME_TIME_COLUMN] === undefined && attribute[0] === 'dateModified') {
        attributes[FIWAREEntity.DEFAULT_NAME_TIME_COLUMN] = attribute[1].value;
      } else if (attribute[0] === 'TimeInstant') {
        attributes[FIWAREEntity.DEFAULT_NAME_TIME_COLUMN] = attribute[1].value;
      } else if (attribute[0] !== 'id' && attribute[0] !== 'type') {
        let attributeValue: any = '-';
        if (attribute[1] instanceof Object) {
          if (attribute[1].type === 'Number' || attribute[1].type === 'Float') {
            attributeValue = parseFloat(attribute[1].value);
          } else if (attribute[1].type === 'Integer') {
            attributeValue = parseInt(attribute[1].value, 10);
          } else if (attribute[1].type === 'Text') {
            attributeValue = String(attribute[1].value);
          } else {
            attributeValue = attribute[1].value;
          }
        } else {
          attributeValue = attribute[1];
        }
        attributes[attribute[0]] = attributeValue;
      }
    });
    return new FIWAREEntity(service, servicePath, entityJson.type, entityJson.id, attributes, entityJson);
  }

  toString() {
    if (this.attributes && this.attributes.name) {
      return `${this.attributes.name} (${this.id})`;
    } else {
      return this.id;
    }
  }
}

export class FIWAREEntityCollection {
  private static DEFAULT_ALL_ENTITY_COLUMNS = ['location', 'latitude', 'longitude'];

  entities: FIWAREEntity[] = [];
  attributesRequested: string[] = [];
  NGSIRaw: any;

  constructor(service: string, servicePath: string, attributesRequested: string[], entitiesResponse: any) {
    let self = this;
    self.NGSIRaw = entitiesResponse;
    if (attributesRequested.length === 0) {
      this.attributesRequested = FIWAREEntityCollection.DEFAULT_ALL_ENTITY_COLUMNS.slice();
    } else {
      this.attributesRequested = attributesRequested;
    }
    entitiesResponse.forEach(function (NGSI_entity: any) {
      let fiwareEntity: FIWAREEntity = FIWAREEntity.parseFromJSON(service, servicePath, NGSI_entity);
      self.entities.push(fiwareEntity);
    });
  }

  isEmpty() {
    return this.entities.length === 0;
  }

  getColumnHeaders(includeTime: boolean) {
    let self = this;
    let columnHeaders = [];
    // columnHeaders.push('id');
    // columnHeaders.push('type');
    if (self.entities.length > 0) {
      Object.keys(self.entities[0].attributes).forEach(function (key) {
        if (key !== 'dateModified' && key !== 'TimeInstant' && key !== FIWAREEntity.DEFAULT_NAME_TIME_COLUMN) {
          columnHeaders.push(key);
        }
      });
    }
    if (includeTime) {
      columnHeaders.push(FIWAREEntity.DEFAULT_NAME_TIME_COLUMN);
    }
    return columnHeaders;
  }

  getEntities() {
    return this.entities;
  }

  getArray() {
    let self = this;
    let entities: any[] = [];
    self.entities.forEach(function (entity: FIWAREEntity) {
      entities.push(entity.id);
    });
    return entities;
  }

  getGrafanaList() {
    return GrafanaUtils.getGrafanaList(this.getArray());
  }

  getAttributeValuesArray(attributeName: string) {
    let self = this;
    // @ts-ignore
    if (self.attributesRequested.includes(attributeName)) {
      let attributeValues: any[] = [];
      self.entities.forEach(function (entity: FIWAREEntity) {
        attributeValues.push(entity.attributes[attributeName]);
      });
      return attributeValues;
    } else {
      return [];
    }
  }

  getAttributeValuesArrayMappingId(attributeName: string): string[][] {
    let self = this;
    // @ts-ignore
    if (self.attributesRequested.includes(attributeName)) {
      let attributeValuesMapping: string[][] = [];
      self.entities.forEach(function (entity: FIWAREEntity) {
        attributeValuesMapping.push([entity.attributes[attributeName], entity.id]);
      });
      return attributeValuesMapping;
    } else {
      return [];
    }
  }

  getAttributeValuesGrafanaList(attributeName: string) {
    return GrafanaUtils.getGrafanaList(this.getAttributeValuesArray(attributeName));
  }

  getAttributeValuesGrafanaListMappingId(attributeName: string) {
    return GrafanaUtils.getGrafanaListMapping(this.getAttributeValuesArrayMappingId(attributeName));
  }

  getAttributeValueAsGrafanaList(attributeName: string) {
    if (this.entities.length !== 1 || this.entities[0].attributes[attributeName] === undefined) {
      return GrafanaUtils.getGrafanaList([]);
    }
    let arrayAttributeValue = this.entities[0].attributes[attributeName];
    if (!Array.isArray(arrayAttributeValue)) {
      arrayAttributeValue = [arrayAttributeValue];
    }
    return GrafanaUtils.getGrafanaList(arrayAttributeValue);
  }

  getGrafanaTable(includeTime: boolean, allEntityAttributes: boolean) {
    let self = this;
    let columns = ['id', 'type'];
    let rows: any[] = [];
    if (this.entities.length === 0) {
      return GrafanaUtils.getTableObject([], []);
    }
    if (allEntityAttributes) {
      columns = columns.concat(self.getColumnHeaders(includeTime));
    } else {
      columns = columns.concat(self.attributesRequested.slice());
      if (includeTime) {
        columns.push(FIWAREEntity.DEFAULT_NAME_TIME_COLUMN);
      }
    }

    let innerRow: any[] = [];
    self.entities.forEach(function (entity: FIWAREEntity) {
      columns.forEach((column) => {
        if (column === 'id') {
          innerRow.push(entity.id);
        } else if (column === 'type') {
          innerRow.push(entity.type);
        } else if (column === 'time') {
          innerRow.push(new Date(entity.attributes['time']).getTime());
        } else {
          let attribute = entity.attributes[column];
          if (attribute !== undefined) {
            innerRow.push(attribute);
          } else {
            innerRow.push('-');
          }
        }
      });
      rows.push(innerRow);
      innerRow = [];
    });
    return GrafanaUtils.getTableObject(columns, rows);
  }
}
