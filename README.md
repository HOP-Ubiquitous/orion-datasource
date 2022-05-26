# Orion Datasource

## Introduction

This datasource gets data from FIWARE Orion Context Broker. It expects a JSON response from Orion which is converted to a table for
displaying on Grafana Dashboards and panels.

## Compatibility

* Grafana <=8.5.x

## Features

* Get Orion **Entities** by Service, Service Path, type, id, **filter**
    - As Grafana table
    - As Grafana table with complex query (**Multi-value** attribute)
    - As dashboard variable

        ```
        {
            "request": "Entities",
            "fiwareScope": {
                "service": "$fiwareService",
                "servicePath": "$fiwareServicePath",
                "type": "$entityType"
            },
            "attributeName": "id,name",
            "queryFilter": "name=='$name'",
            "executePostQueryFilter": true
        }
        ```

* Get Orion Entity Attribute Name by Service, Service Path, type, id
    - As dashboard variable

        ```
        {
            "request": "AttributeName",
            "fiwareScope": {
                "service": "$service",
                "servicePath": "$servicepath",
                "type": "$entityType"
            },
            "entityId": "All"
        }
        ```
* Get Orion Entity **Attribute** by Service, Service Path, type, id, attribute name
    - As dashboard variable

        ```
        {
            "request": "AttributeValue",
            "fiwareScope": {
                "service": "$service",
                "servicePath": "$servicepath",
                "type": "$entityType"
            },
            "entityId": "All",
            "attributeName": "name,project",
            "queryFilter": "project=='$project'",
            "executePostQueryFilter": true
        }
        ```

* Get Orion Entity **Attribute** by Service, Service Path, type, id and attribute name **as Mapping Id List**
    - As dashboard variable

        ```
        {
            "request": "AttributeValueAsMapping",
            "fiwareScope": {
                "service": "$fiwareService",
                "servicePath": "$fiwareServicePath",
                "type": "$entityType"
            },
            "entityId": "$entityId",
            "attributeName": "resources,name,project", // first attribute array to list
            "queryFilter": "project=='$project'",
            "executePostQueryFilter": true
        }
        ```
      
        ```
            [{ text: "NAME", value: "ENTITY_ID" }]
        ```

* Get Orion Entity **Attribute** by Service, Service Path, type, id and attribute name **as List**
    - As dashboard variable

        ```
        {
            "request": "AttributeValueAsList",
            "fiwareScope": {
                "service": "$fiwareService",
                "servicePath": "$fiwareServicePath",
                "type": "$entityType"
            },
            "entityId": "$entityId",
            "attributeName": "resources,name,project", // first attribute array to list
            "queryFilter": "project=='$project'",
            "executePostQueryFilter": true
        }
        ```

* Get All Fiware Services
    - As dashboard variable

        ```
        {
            "request": "FiwareServices"
        }
        ```

* Get All Fiware Service Paths by Fiware Service
    - As dashboard variable

        ```
        {
            "request": "FiwareServicePaths",
            "fiwareScope": {
                "service": "$fiwareService"
            }
        }
        ``` 

## Requirements

- Orion **3.6.0** (recommended)

## Development

### Compile

- Install dependecies

    ```shell
    $ npm install
    ```

    ```shell
    $ yarn install
    ```

- Construct dist

    ```shell
    $ yarn watch
    ```

    ```shell
    $ yarn build
    ```

### Config

- Grafana [docker-compose](docker-compose/docker-compose.yml):

    - Configure root url:

        ```
        GF_SERVER_ROOT_URL=http://localhost:3000
        ```

    - Add plugin dist compiled:

        ```
        volumes:
            - type: bind
              source: ./dist
              target: /var/lib/grafana/plugins/orion-datasource
        ```

    - Environment value required for correct visualization:

        ```
        GF_PANELS_DISABLE_SANITIZE_HTML=true #text HTML panel in 6.0+
        ```

    - Update plugins command:

        ```
        $ grafana-cli plugins update-all
        ```

### Naming

- Dashboard variables:
    - **fiwareService**
    - **fiwareServicePath**
    - **$entityId**
    - **$entityType**

## Run

- Docker exec:

    ```
    $ cd docker-compose
    $ docker-compose up
    ```

- http://localhost:3000/plugins/orion/

### Orion Config

Create a new orion-datasource with url on [datasources](http://localhost:3000/datasources):

- http://orion-dev:1026/

#### Orion entities to test

Commands to initiate the Context:

```
curl --location --request POST 'http://localhost:1026/v2/entities' \
--header 'fiware-service: test' \
--header 'fiware-servicepath: /test' \
--header 'Content-Type: application/json' \
--data-raw '{
    "id": "urn:ngsi:Test1",
    "type": "Test",
    "name": {
        "type": "Text",
        "value": "Test1",
        "metadata": {}
    },  
    "LAeq": {
        "type": "Number",
        "value": 35.6,
        "metadata": {}
    },
    "latitude": {
        "type": "Number",
        "value": 38.077053,
        "metadata": {}
    },
    "longitude": {
        "type": "Number",
        "value": -1.271294,
        "metadata": {}
    },
    "resources": {
        "type": "StructuredValue",
        "value": ["CO", "NO", "NO2", "SO2","O3"],
        "metadata": {}
    },
    "CO": {
        "type": "Number",
        "value": 1,
        "metadata": {}
    },
        "NO": {
        "type": "Number",
        "value": 2,
        "metadata": {}
    },
        "NO2": {
        "type": "Number",
        "value": 3,
        "metadata": {}
    },
        "SO2": {
        "type": "Number",
        "value": 4,
        "metadata": {}
    },
        "O3": {
        "type": "Number",
        "value": 5,
        "metadata": {}
    },
    "location": {
        "type": "geo:json",
        "value": {
            "type": "Point",
            "coordinates": [
                -1.271294,
                38.077053
            ]
        }
    },
    "TimeInstant": {
        "type": "DateTime",
        "value": "2022-05-25T00:00:00.000Z",
        "metadata": {}
    }
}'
```

```
curl --location --request POST 'http://localhost:1026/v2/entities' \
--header 'fiware-service: test' \
--header 'fiware-servicepath: /test' \
--header 'Content-Type: application/json' \
--data-raw '{
    "id": "urn:ngsi:Test2",
    "type": "Test",
    "name": {
        "type": "Text",
        "value": "Test2",
        "metadata": {}
    },    
    "LAeq": {
        "type": "Number",
        "value": 60,
        "metadata": {}
    },
    "latitude": {
        "type": "Number",
        "value": 39.481377,
        "metadata": {}
    },
    "longitude": {
        "type": "Number",
        "value": -0.377954,
        "metadata": {}
    },
    "location": {
        "type": "geo:json",
        "value": {
            "type": "Point",
            "coordinates": [
                -0.377954,
                39.481377
            ]
        }
    },
    "TimeInstant": {
        "type": "DateTime",
        "value": "2022-05-25T01:00:00.000Z",
        "metadata": {}
    }
}'
```

```
curl --location --request DELETE 'http://localhost:1026/v2/entities/urn:ngsi:Test1' \
--header 'fiware-service: test' \
--header 'fiware-servicepath: /test'
```

```
curl --location --request DELETE 'http://localhost:1026/v2/entities/urn:ngsi:Test2' \
--header 'fiware-service: test' \
--header 'fiware-servicepath: /test'
```

### Dashboard examples to test

- [Dashboard examples](dashboards/)


## ToDo

None 