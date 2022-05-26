export class GrafanaUtils {
  static setEmptyGrafanaTable(tableData: any) {
    tableData.data[0].rows = [];
    return tableData;
  }

  static getGrafanaList(variableList: string[]) {
    let grafanaVariableList: any[] = [];
    variableList.forEach(function (variable: string) {
      grafanaVariableList.push({ text: variable, value: variable });
    });
    return grafanaVariableList;
  }

  static getGrafanaListMapping(variableTextValueList: string[][]) {
    let grafanaVariableList: any[] = [];
    variableTextValueList.forEach(function (textValue: string[]) {
      grafanaVariableList.push({ text: textValue[0], value: textValue[1] });
    });
    return grafanaVariableList;
  }

  static getTableObject(columnsString: any, rows: any) {
    let columns: any[] = [];
    columnsString.forEach(function (column: string) {
      columns.push({ text: column });
    });
    return [
      {
        columns: columns,
        rows: rows,
        type: 'table',
      },
    ];
  }
}
