/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is auto-generated. Do not modify it manually.
 * Changes to this file may be overwritten.
 */

export const dataSourcesInfo = {
  "activitypointers": {
    "tableId": "",
    "version": "",
    "primaryKey": "activityid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "confluence": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "GetSpaces": {
        "path": "/{connectionId}/ex/confluence/{cloudId}/wiki/api/v2/spaces",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "cloudId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetPages": {
        "path": "/{connectionId}/ex/confluence/{cloudId}/wiki/api/v2/pages",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "cloudId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetPagesBySpace": {
        "path": "/{connectionId}/ex/confluence/{cloudId}/wiki/api/v2/spaces/{spaceId}/pages",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "cloudId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "spaceId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetPageMetadata": {
        "path": "/{connectionId}/ex/confluence/{cloudId}/wiki/api/v2/pages/{pageId}/{spaceId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "cloudId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "spaceId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "pageId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      }
    }
  },
  "jira": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "EditIssue": {
        "path": "/{connectionId}/3/issue/{issueIdOrKey}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "issueIdOrKey",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "notifyUsers",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "overrideScreenSecurity",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "overrideEditableFlag",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "204": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "EditIssue_V2": {
        "path": "/{connectionId}/v2/3/issue/{issueIdOrKey}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "issueIdOrKey",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "notifyUsers",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "overrideScreenSecurity",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "overrideEditableFlag",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "204": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "DeleteProject": {
        "path": "/{connectionId}/3/project/{projectIdOrKey}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectIdOrKey",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "enableUndo",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "UpdateProject": {
        "path": "/{connectionId}/3/project/{projectIdOrKey}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectIdOrKey",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "DeleteProject_V2": {
        "path": "/{connectionId}/v2/project/{projectIdOrKey}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectIdOrKey",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "enableUndo",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "UpdateProject_V2": {
        "path": "/{connectionId}/v2/project/{projectIdOrKey}",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectIdOrKey",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetAllProjectCategories": {
        "path": "/{connectionId}/3/projectCategory",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "401": {
            "type": "void"
          }
        }
      },
      "CreateProjectCategory": {
        "path": "/{connectionId}/3/projectCategory",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "void"
          }
        }
      },
      "GetAllProjectCategories_V2": {
        "path": "/{connectionId}/v2/projectCategory",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "401": {
            "type": "void"
          }
        }
      },
      "CreateProjectCategory_V2": {
        "path": "/{connectionId}/v2/projectCategory",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "409": {
            "type": "void"
          }
        }
      },
      "RemoveProjectCategory": {
        "path": "/{connectionId}/3/projectCategory/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "RemoveProjectCategory_V2": {
        "path": "/{connectionId}/v2/projectCategory/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "integer",
            "format": "int64"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetTask": {
        "path": "/{connectionId}/3/task/{taskId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "taskId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetTask_V2": {
        "path": "/{connectionId}/v2/task/{taskId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "taskId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "CancelTask": {
        "path": "/{connectionId}/3/task/{taskId}/cancel",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "taskId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Atlassian-Token",
            "in": "header",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "202": {
            "type": "object"
          },
          "400": {
            "type": "array"
          },
          "401": {
            "type": "array"
          },
          "403": {
            "type": "array"
          },
          "404": {
            "type": "array"
          }
        }
      },
      "CancelTask_V2": {
        "path": "/{connectionId}/v2/task/{taskId}/cancel",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "taskId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Atlassian-Token",
            "in": "header",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "202": {
            "type": "object"
          },
          "400": {
            "type": "array"
          },
          "401": {
            "type": "array"
          },
          "403": {
            "type": "array"
          },
          "404": {
            "type": "array"
          }
        }
      },
      "GetUser": {
        "path": "/{connectionId}/3/user",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "accountId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "expand",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetUser_V2": {
        "path": "/{connectionId}/v2/user",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "accountId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "expand",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "CreateIssue": {
        "path": "/{connectionId}/issue",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectKey",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "CreateIssueV2": {
        "path": "/{connectionId}/v2/issue",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectKey",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "issueTypeIds",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "CreateIssue_V3": {
        "path": "/{connectionId}/v3/issue",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectKey",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "issueTypeIds",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "GetIssue": {
        "path": "/{connectionId}/issue/{issueKey}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "issueKey",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetIssue_V2": {
        "path": "/{connectionId}/v2/issue/{issueKey}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "issueKey",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "AddComment": {
        "path": "/{connectionId}/issue/{issueKey}/comment",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "issueKey",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "AddComment_V2": {
        "path": "/{connectionId}/v2/issue/{issueKey}/comment",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "issueKey",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "ListProjects": {
        "path": "/{connectionId}/project",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "CreateProject": {
        "path": "/{connectionId}/project",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Project",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "CreateProject_V2": {
        "path": "/{connectionId}/v2/project",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "Project",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "ListProjects_V2": {
        "path": "/{connectionId}/project/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListProjects_V3": {
        "path": "/{connectionId}/v2/project/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListProjectUsers": {
        "path": "/{connectionId}/user/permission/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectKey",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "ListProjectUsers_V2": {
        "path": "/{connectionId}/v2/user/permission/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectKey",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "ListFilters": {
        "path": "/{connectionId}/2/filter/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListFilters_V2": {
        "path": "/{connectionId}/v2/filter/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListResources": {
        "path": "/{connectionId}/oauth/token/accessible-resources",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "ListIssues": {
        "path": "/{connectionId}/2/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "jql",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "expand",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fields",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "nextPageToken",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          }
        }
      },
      "ListIssues_Datacenter": {
        "path": "/{connectionId}/datacenter/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          }
        }
      },
      "ListTransitions": {
        "path": "/{connectionId}/3/issue/{issueIdOrKey}/transitions",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "issueIdOrKey",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "UpdateTransition": {
        "path": "/{connectionId}/3/issue/{issueIdOrKey}/transitions",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "issueIdOrKey",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "404": {
            "type": "void"
          }
        }
      },
      "GetCurrentUser": {
        "path": "/{connectionId}/3/myself",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "expand",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "void"
          }
        }
      },
      "OnNewIssue": {
        "path": "/{connectionId}/new_issue_trigger/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectKey",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnNewIssue_V2": {
        "path": "/{connectionId}/v2/new_issue_trigger/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectKey",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnNewIssue_Datacenter": {
        "path": "/{connectionId}/datacenter/new_issue_trigger/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectKey",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnCloseIssue": {
        "path": "/{connectionId}/close_issue_trigger/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectKey",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnCloseIssue_V2": {
        "path": "/{connectionId}/v2/close_issue_trigger/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectKey",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnCloseIssue_Datacenter": {
        "path": "/{connectionId}/datacenter/close_issue_trigger/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "projectKey",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnNewIssueJQL": {
        "path": "/{connectionId}/new_issue_jql_trigger/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "jql",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnNewIssueJQL_V2": {
        "path": "/{connectionId}/v2/new_issue_jql_trigger/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "jql",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnNewIssueJQL_Datacenter": {
        "path": "/{connectionId}/datacenter/new_issue_jql_trigger/search",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "jql",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "X-Request-Jirainstance",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "mcp_JiraIssueManagement": {
        "path": "/{connectionId}/mcp/JiraIssueManagement",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      }
    }
  },
  "knk_contracttypes": {
    "tableId": "",
    "version": "",
    "primaryKey": "knk_contracttypeid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "knk_subscriptions": {
    "tableId": "",
    "version": "",
    "primaryKey": "knk_subscriptionid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "knk_subscriptionservices": {
    "tableId": "",
    "version": "",
    "primaryKey": "knk_subscriptionserviceid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "leads": {
    "tableId": "",
    "version": "",
    "primaryKey": "leadid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "office365": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "OnUpcomingEvents": {
        "path": "/{connectionId}/Events/OnUpcomingEvents",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "lookAheadTimeInMinutes",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnUpcomingEventsV2": {
        "path": "/{connectionId}/v2/Events/OnUpcomingEvents",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "lookAheadTimeInMinutes",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnUpcomingEventsV3": {
        "path": "/{connectionId}/v3/Events/OnUpcomingEvents",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "lookAheadTimeInMinutes",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEventsCalendarView": {
        "path": "/{connectionId}/Events/CalendarView",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "calendarId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "startDateTimeOffset",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDateTimeOffset",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEmails": {
        "path": "/{connectionId}/Mail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyUnread",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "searchQuery",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SendEmail": {
        "path": "/{connectionId}/Mail",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "emailMessage",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetOutlookCategoryNames": {
        "path": "/{connectionId}/Categories",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DraftEmail": {
        "path": "/{connectionId}/Draft",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "draftMessage",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "messageId",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "draftType",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "comment",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateDraftEmail": {
        "path": "/{connectionId}/Draft",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "draftMessage",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "messageId",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SendDraftEmail": {
        "path": "/{connectionId}/Draft/Send/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "AssignCategory": {
        "path": "/{connectionId}/Mail/Category",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "category",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "AssignCategoryBulk": {
        "path": "/{connectionId}/Mail/Category/Bulk/{categoryName}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageIds",
            "in": "body",
            "required": true,
            "type": "array"
          },
          {
            "name": "categoryName",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEmailsV2": {
        "path": "/{connectionId}/v2/Mail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyUnread",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchOnlyFlagged",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "searchQuery",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SendEmailV2": {
        "path": "/{connectionId}/v2/Mail",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "emailMessage",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEmail": {
        "path": "/{connectionId}/Mail/{messageId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "internetMessageId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DeleteEmail": {
        "path": "/{connectionId}/Mail/{messageId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEmailV2": {
        "path": "/{connectionId}/v2/Mail/{messageId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "internetMessageId",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "extractSensitivityLabel",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchSensitivityLabelMetadata",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEmailsV3": {
        "path": "/{connectionId}/v3/Mail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyUnread",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchOnlyFlagged",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "searchQuery",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "Move": {
        "path": "/{connectionId}/Mail/Move/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "MoveV2": {
        "path": "/{connectionId}/v2/Mail/Move/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "Flag": {
        "path": "/{connectionId}/Mail/Flag/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "MarkAsRead": {
        "path": "/{connectionId}/Mail/MarkAsRead/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ReplyTo": {
        "path": "/{connectionId}/Mail/ReplyTo/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "comment",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "replyAll",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ReplyToV2": {
        "path": "/{connectionId}/v2/Mail/ReplyTo/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "replyParameters",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ReplyToV3": {
        "path": "/{connectionId}/v3/Mail/ReplyTo/{messageId}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "replyParameters",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetAttachment": {
        "path": "/{connectionId}/Mail/{messageId}/Attachments/{attachmentId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "attachmentId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewEmail": {
        "path": "/{connectionId}/Mail/OnNewEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewEmailV2": {
        "path": "/{connectionId}/v2/Mail/OnNewEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewEmailV3": {
        "path": "/{connectionId}/v3/Mail/OnNewEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnFlaggedEmail": {
        "path": "/{connectionId}/Mail/OnFlaggedEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnFlaggedEmailV2": {
        "path": "/{connectionId}/v2/Mail/OnFlaggedEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnFlaggedEmailV3": {
        "path": "/{connectionId}/v3/Mail/OnFlaggedEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnFlaggedEmailV4": {
        "path": "/{connectionId}/v4/Mail/OnFlaggedEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewMentionMeEmail": {
        "path": "/{connectionId}/Mail/OnNewMentionMeEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageIdToFireOnFirstTriggerRun",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewMentionMeEmailV2": {
        "path": "/{connectionId}/v2/Mail/OnNewMentionMeEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageIdToFireOnFirstTriggerRun",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "OnNewMentionMeEmailV3": {
        "path": "/{connectionId}/v3/Mail/OnNewMentionMeEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageIdToFireOnFirstTriggerRun",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "fetchOnlyWithAttachment",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "202": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SetAutomaticRepliesSetting": {
        "path": "/{connectionId}/AutomaticRepliesSetting",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "clientSetting",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetMailTips": {
        "path": "/{connectionId}/MailTips",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CreateOnNewEmailSubscription": {
        "path": "/{connectionId}/MailSubscription/$subscriptions",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "subscription",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "folderPath",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "hasAttachment",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SendMailWithOptions": {
        "path": "/{connectionId}/mailwithoptions/$subscriptions",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "optionsEmailSubscription",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SendApprovalMail": {
        "path": "/{connectionId}/approvalmail/$subscriptions",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "approvalEmailSubscription",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SharedMailboxSendEmail": {
        "path": "/{connectionId}/SharedMailbox/Mail",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "emailMessage",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SharedMailboxSendEmailV2": {
        "path": "/{connectionId}/v2/SharedMailbox/Mail",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "emailMessage",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SharedMailboxOnNewEmail": {
        "path": "/{connectionId}/SharedMailbox/Mail/OnNewEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "hasAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "SharedMailboxOnNewEmailV2": {
        "path": "/{connectionId}/v2/SharedMailbox/Mail/OnNewEmail",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "cc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "toOrCc",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "type": "string",
            "format": "email"
          },
          {
            "name": "importance",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "hasAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "includeAttachments",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "subjectFilter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetTables": {
        "path": "/{connectionId}/datasets/calendars/tables",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetItems": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/items",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarPostItem": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/items",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetItem": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/items/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarDeleteItem": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/items/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarPatchItem": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/items/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V3CalendarGetItems": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/items",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V3CalendarPostItem": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/items",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V4CalendarGetItems": {
        "path": "/{connectionId}/datasets/calendars/v4/tables/{table}/items",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V4CalendarPostItem": {
        "path": "/{connectionId}/datasets/calendars/v4/tables/{table}/items",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V2CalendarGetItems": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/items",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V2CalendarPostItem": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/items",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEventsCalendarViewV2": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/items/calendarview",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "calendarId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "startDateTimeOffset",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDateTimeOffset",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetEventsCalendarViewV3": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/items/calendarview",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "calendarId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "startDateTimeUtc",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "endDateTimeUtc",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "search",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V2CalendarGetItem": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/items/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V2CalendarPatchItem": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/items/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V3CalendarGetItem": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/items/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V3CalendarPatchItem": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/items/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "V4CalendarPatchItem": {
        "path": "/{connectionId}/datasets/calendars/v4/tables/{table}/items/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnNewItems": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/onnewitems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnUpdatedItems": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/onupdateditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnNewItemsV2": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/onnewitems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnNewItemsV3": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/onnewitems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "x-ms-operation-context",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnUpdatedItemsV2": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/onupdateditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnUpdatedItemsV3": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/onupdateditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnChangedItems": {
        "path": "/{connectionId}/datasets/calendars/tables/{table}/onchangeditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "incomingDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "pastDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnChangedItemsV2": {
        "path": "/{connectionId}/datasets/calendars/v2/tables/{table}/onchangeditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "incomingDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "pastDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetOnChangedItemsV3": {
        "path": "/{connectionId}/datasets/calendars/v3/tables/{table}/onchangeditems",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "incomingDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "pastDays",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetTables": {
        "path": "/{connectionId}/datasets/contacts/tables",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetTablesV2": {
        "path": "/{connectionId}/v2/datasets/contacts/tables",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetItems": {
        "path": "/{connectionId}/datasets/contacts/tables/{table}/items",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactPostItem": {
        "path": "/{connectionId}/datasets/contacts/tables/{table}/items",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetItem": {
        "path": "/{connectionId}/datasets/contacts/tables/{table}/items/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactDeleteItem": {
        "path": "/{connectionId}/datasets/contacts/tables/{table}/items/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactPatchItem": {
        "path": "/{connectionId}/datasets/contacts/tables/{table}/items/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "table",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ExportEmail": {
        "path": "/{connectionId}/codeless/api/beta/me/messages/{messageId}/$value",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ExportEmail_V2": {
        "path": "/{connectionId}/codeless/beta/me/messages/{messageId}/$value",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "string",
            "format": "binary"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "Flag_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/messages/{messageId}/flag",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "MarkAsRead_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/messages/{messageId}/markAsRead",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "MarkAsRead_V3": {
        "path": "/{connectionId}/codeless/v3/v1.0/me/messages/{messageId}/markAsRead",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "DeleteEmail_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/messages/{messageId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetAttachment_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/messages/{messageId}/attachments/{attachmentId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "messageId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "attachmentId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "extractSensitivityLabel",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchSensitivityLabelMetadata",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "400": {
            "type": "void"
          },
          "401": {
            "type": "void"
          },
          "403": {
            "type": "void"
          },
          "500": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "RespondToEvent": {
        "path": "/{connectionId}/codeless/api/v2.0/me/events/{event_id}/{response}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "event_id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "response",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "RespondToEvent_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/events/{event_id}/{response}",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "event_id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "response",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": false,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ForwardEmail": {
        "path": "/{connectionId}/codeless/api/v2.0/me/messages/{message_id}/forward",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "message_id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ForwardEmail_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/messages/{message_id}/forward",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "message_id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "mailboxAddress",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "extractSensitivityLabel",
            "in": "query",
            "required": false,
            "type": "boolean"
          },
          {
            "name": "fetchSensitivityLabelMetadata",
            "in": "query",
            "required": false,
            "type": "boolean"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetRoomLists": {
        "path": "/{connectionId}/codeless/api/beta/me/findroomlists",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetRoomLists_V2": {
        "path": "/{connectionId}/codeless/beta/me/findRoomLists",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetRooms": {
        "path": "/{connectionId}/codeless/api/beta/me/findrooms",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetRooms_V2": {
        "path": "/{connectionId}/codeless/beta/me/findRooms",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetRoomsInRoomList": {
        "path": "/{connectionId}/codeless/api/beta/me/findrooms(roomlist='{room_list}')",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "room_list",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetRoomsInRoomList_V2": {
        "path": "/{connectionId}/codeless/beta/me/findRooms(RoomList='{room_list}')",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "room_list",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "FindMeetingTimes": {
        "path": "/{connectionId}/codeless/api/v2.0/me/findmeetingtimes",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "FindMeetingTimes_V2": {
        "path": "/{connectionId}/codeless/beta/me/findMeetingTimes",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "SetAutomaticRepliesSetting_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/mailboxSettings",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "GetMailTips_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/getMailTips",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarGetTables_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/calendars",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "orderBy",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "CalendarDeleteItem_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/calendars/{calendar}/events/{event}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "calendar",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "event",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetItem_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactDeleteItem_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactPatchItem_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactGetItems_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$filter",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$orderby",
            "in": "query",
            "required": false,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          },
          {
            "name": "$skip",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "ContactPostItem_V2": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "item",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "UpdateMyContactPhoto": {
        "path": "/{connectionId}/codeless/v1.0/me/contactFolders/{folder}/contacts/{id}/photo/$value",
        "method": "PUT",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folder",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "string",
            "format": "binary"
          },
          {
            "name": "Content-Type",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "void"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "HttpRequest": {
        "path": "/{connectionId}/codeless/httprequest",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "Uri",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "Method",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "Body",
            "in": "body",
            "required": false,
            "type": "string",
            "format": "binary"
          },
          {
            "name": "ContentType",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader1",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader2",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader3",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader4",
            "in": "header",
            "required": false,
            "type": "string"
          },
          {
            "name": "CustomHeader5",
            "in": "header",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_EmailsManagement": {
        "path": "/{connectionId}/mcp/EmailsManagement",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_MeetingManagement": {
        "path": "/{connectionId}/mcp/MeetingManagement",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      },
      "mcp_ContactsManagement": {
        "path": "/{connectionId}/mcp/ContactsManagement",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "queryRequest",
            "in": "body",
            "required": false,
            "type": "object"
          },
          {
            "name": "sessionId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      }
    }
  },
  "opportunities": {
    "tableId": "",
    "version": "",
    "primaryKey": "opportunityid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "planner": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "GetTask_V2": {
        "path": "/{connectionId}/v1.0/planner/tasks/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "DeleteTask": {
        "path": "/{connectionId}/v1.0/planner/tasks/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          }
        }
      },
      "UpdateTask_V2": {
        "path": "/{connectionId}/v1.0/planner/tasks/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "UpdateTask_V3": {
        "path": "/{connectionId}/v2/v1.0/planner/tasks/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "CreateTask_V3": {
        "path": "/{connectionId}/v2/v1.0/planner/tasks",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "CreateTask_V4": {
        "path": "/{connectionId}/v2/beta/planner/tasks",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "ListTasks_V3": {
        "path": "/{connectionId}/v2/v1.0/planner/plans/{id}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListMyTasks_V2": {
        "path": "/{connectionId}/v1.0/me/planner/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "UnassignUsers": {
        "path": "/{connectionId}/v1.0/planner/tasks/{id}/unassignusers",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "AssignUsers": {
        "path": "/{connectionId}/v1.0/planner/tasks/{id}/assignusers",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListBuckets_V3": {
        "path": "/{connectionId}/v2/v1.0/planner/plans/{id}/buckets",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "CreateBucket_V2": {
        "path": "/{connectionId}/v2/v1.0/planner/buckets",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "GetTaskDetails_V2": {
        "path": "/{connectionId}/v1.0/planner/tasks/{id}/details",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "UpdateTaskDetails_V2": {
        "path": "/{connectionId}/v1.0/planner/tasks/{id}/details",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListGroupPlans": {
        "path": "/{connectionId}/v1.0/groups/{groupId}/planner/plans",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "OnNewTask": {
        "path": "/{connectionId}/beta/planner/onnewtask_trigger/plans/{id}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "OnCompleteTask": {
        "path": "/{connectionId}/beta/planner/oncompletetask_trigger/plans/{id}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "OnTaskAssignedToMe": {
        "path": "/{connectionId}/beta/me/planner/ontaskassignedtome_trigger/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetTask": {
        "path": "/{connectionId}/beta/planner/tasks/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "UpdateTask": {
        "path": "/{connectionId}/beta/planner/tasks/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListBuckets": {
        "path": "/{connectionId}/beta/planner/plans/{id}/buckets",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "CreateTask": {
        "path": "/{connectionId}/beta/planner/tasks",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "ListTasks": {
        "path": "/{connectionId}/beta/planner/plans/{id}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListMyTasks": {
        "path": "/{connectionId}/beta/me/planner/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListMyPlans": {
        "path": "/{connectionId}/beta/me/planner/plans",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetTaskDetails": {
        "path": "/{connectionId}/beta/planner/tasks/{id}/details",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "UpdateTaskDetails": {
        "path": "/{connectionId}/beta/planner/tasks/{id}/details",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "OnNewTask_V2": {
        "path": "/{connectionId}/v1.0/planner/onnewtask_trigger/plans/{id}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "OnNewTask_V3": {
        "path": "/{connectionId}/v2/v1.0/planner/onnewtask_trigger/plans/{id}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "OnCompleteTask_V2": {
        "path": "/{connectionId}/v1.0/planner/oncompletetask_trigger/plans/{id}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "OnCompleteTask_V3": {
        "path": "/{connectionId}/v2/v1.0/planner/oncompletetask_trigger/plans/{id}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "groupId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "OnTaskAssignedToMe_V2": {
        "path": "/{connectionId}/v1.0/me/planner/ontaskassignedtome_trigger/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListBuckets_V2": {
        "path": "/{connectionId}/v1.0/planner/plans/{id}/buckets",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "CreateBucket": {
        "path": "/{connectionId}/v1.0/planner/buckets",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "CreateTask_V2": {
        "path": "/{connectionId}/v1.0/planner/tasks",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "prefer",
            "in": "header",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "ListTasks_V2": {
        "path": "/{connectionId}/v1.0/planner/plans/{id}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListMyPlans_V2": {
        "path": "/{connectionId}/v1.0/me/planner/plans",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetPlanDetails": {
        "path": "/{connectionId}/v1.0/planner/plans/{id}/details",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "401": {
            "type": "object"
          },
          "403": {
            "type": "object"
          },
          "404": {
            "type": "object"
          },
          "405": {
            "type": "object"
          },
          "default": {
            "type": "void"
          }
        }
      }
    }
  },
  "systemusers": {
    "tableId": "",
    "version": "",
    "primaryKey": "systemuserid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "todo": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "OnNewToDo": {
        "path": "/{connectionId}/trigger/onNewToDo",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnNewToDoInFolder": {
        "path": "/{connectionId}/trigger/onNewToDoInFolder/{folderId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnUpdateToDo": {
        "path": "/{connectionId}/trigger/onUpdateToDo",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnUpdateToDoInFolder": {
        "path": "/{connectionId}/trigger/onUpdateToDoInFolder/{folderId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "GetAllTodoListsV2": {
        "path": "/{connectionId}/lists",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "CreateToDoListV2": {
        "path": "/{connectionId}/lists",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetToDoListV2": {
        "path": "/{connectionId}/lists/{folderId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "UpdateToDoList": {
        "path": "/{connectionId}/lists/{folderId}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "DeleteToDoList": {
        "path": "/{connectionId}/lists/{folderId}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          }
        }
      },
      "ListToDosByFolderV2": {
        "path": "/{connectionId}/lists/{folderId}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "CreateToDoV3": {
        "path": "/{connectionId}/lists/{folderId}/tasks",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "GetToDoV3": {
        "path": "/{connectionId}/lists/{folderId}/tasks/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "UpdateToDoV2": {
        "path": "/{connectionId}/lists/{folderId}/tasks/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "DeleteToDoV2": {
        "path": "/{connectionId}/lists/{folderId}/tasks/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          }
        }
      },
      "GetAllTodoLists": {
        "path": "/{connectionId}/taskfolders",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "CreateToDoList": {
        "path": "/{connectionId}/taskfolders",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "GetToDoList": {
        "path": "/{connectionId}/taskFolders/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "ListToDosByFolder": {
        "path": "/{connectionId}/taskFolders/{folderId}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "ListAllToDos": {
        "path": "/{connectionId}/tasks",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "$top",
            "in": "query",
            "required": false,
            "type": "integer",
            "format": "int32"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "CreateToDo": {
        "path": "/{connectionId}/tasks",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "folderId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "CreateToDoV2": {
        "path": "/{connectionId}/v2/tasks",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "folderId",
            "in": "query",
            "required": false,
            "type": "string"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "GetToDo": {
        "path": "/{connectionId}/tasks/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "UpdateToDo": {
        "path": "/{connectionId}/tasks/{id}",
        "method": "PATCH",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "body",
            "in": "body",
            "required": true,
            "type": "object"
          }
        ],
        "responseInfo": {
          "201": {
            "type": "object"
          }
        }
      },
      "DeleteToDo": {
        "path": "/{connectionId}/tasks/{id}",
        "method": "DELETE",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "204": {
            "type": "void"
          }
        }
      },
      "GetToDoV2": {
        "path": "/{connectionId}/v2/tasks/{id}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "query",
            "required": true,
            "type": "string"
          },
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      },
      "OnNewToDoInFolderV2": {
        "path": "/{connectionId}/v2/trigger/onNewToDoInFolder/{folderId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      },
      "OnUpdateToDoInFolderV2": {
        "path": "/{connectionId}/v2/trigger/onUpdateToDoInFolder/{folderId}",
        "method": "GET",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "folderId",
            "in": "path",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "array"
          }
        }
      }
    }
  }
};
