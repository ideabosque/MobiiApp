import os
import metadata,time

class MetadataManager:
    def __init__(self):
        self.tokens={}
        pass

    def getTokens(self):
        return self.tokens

    def delToken(paths):
        for path in paths:
            if path in self.tokens:
                del self.tokens[path]
                
    def saveMetadata(self,path,uid):
        if self.tokensControl(path, uid) == 'Token Conflict':
            return 'Token Conflict'
        else:
            file = open(path, "w")
            self.tokens = self.tokensControl(path, uid)
            self.tokens[path]['rootObject'].export(file, 0)
            del self.tokens[path]
            return 'Pass'

    def getSchemas(self,path):
        rootObject = metadata.parse(path)
        return rootObject.schema

    def getColumns(self, schemaName, path):
        rootObject = metadata.parse(path)
        schemaObjs = rootObject.schema
        for schemaObj in schemaObjs:
            if schemaObj.schemaName == schemaName:
                return schemaObj.column
            
    def setSchema(self,path,schema,uid):
        if self.tokensControl(path, uid) == 'Token Conflict':
            return 'Token Conflict'
        else:
            self.tokens = self.tokensControl(path, uid)
            i = self.getSchemaIndex(schema.schemaName,self.tokens[path]['rootObject'])
            self.tokens[path]['rootObject'].schema[i].schemaDesc = schema.schemaDesc
            return 'Pass'
    
    def setColumn(self, schemaName, column, path, uid):
        if self.tokensControl(path, uid) == 'Token Conflict':
            return 'Token Conflict'
        else:
            self.tokens = self.tokensControl(path, uid)
            i = self.getSchemaIndex(schemaName,self.tokens[path]['rootObject'])
            schema = self.tokens[path]['rootObject'].schema[i]
            columnName = column.columnName
            j = self.getColumnIndex(schema, columnName)
            
            drillColumnObjs = []
            for drillColumn in column.drillColumns:
                drillColumnObj = metadata.drillColumn()
                drillColumnObj.columnName = drillColumn.columnName
                drillColumnObj.weight = drillColumn.weight
                drillColumnObjs.append(drillColumnObj)

            tableObjs = []
            for table in column.tables:
                tableObj = metadata.table()
                tableObj.tableName = table.tableName
                tableObj.position = table.position
                tableObjs.append(tableObj)

            dimColumnObjs = []
            for dimColumn in column.dimColumns:         
                dimColumnObj = metadata.dimColumn()
                dimColumnObj.columnName = dimColumn.columnName
                dimColumnObjs.append(dimColumnObj)
                    
            self.tokens[path]['rootObject'].schema[i].column[j].columnName = column.columnName
            self.tokens[path]['rootObject'].schema[i].column[j].columnAlias = column.columnAlias
            self.tokens[path]['rootObject'].schema[i].column[j].columnDesc = column.columnDesc
            self.tokens[path]['rootObject'].schema[i].column[j].nullable = column.nullable
            self.tokens[path]['rootObject'].schema[i].column[j].dataType = column.dataType
            self.tokens[path]['rootObject'].schema[i].column[j].aggregateable = column.aggregateable
            self.tokens[path]['rootObject'].schema[i].column[j].aggrRule = column.aggrRule
            self.tokens[path]['rootObject'].schema[i].column[j].drillColumn = drillColumnObjs
            self.tokens[path]['rootObject'].schema[i].column[j].table = tableObjs
            self.tokens[path]['rootObject'].schema[i].column[j].dimColumn = dimColumnObjs
            return 'Pass'

    def addSchema(self,path,schema,uid):
        if self.tokensControl(path, uid) == 'Token Conflict':
            return 'Token Conflict'
        else:
            self.tokens = self.tokensControl(path, uid)
            schemaObj = metadata.schema()
            schemaObj.schemaName = schema.schemaName
            schemaObj.schemaDesc = schema.schemaDesc
            self.tokens[path]['rootObject'].add_schema(schemaObj)
            return 'Pass'

    def addColumn(self, schemaName, column, path, uid):
        if self.tokensControl(path, uid) == 'Token Conflict':
            return 'Token Conflict'
        else:
            self.tokens = self.tokensControl(path, uid)
            i = self.getSchemaIndex(schemaName,self.tokens[path]['rootObject'])
            columnObj = metadata.column()
            columnObj.columnName = column.columnName
            columnObj.columnAlias = column.columnAlias
            columnObj.columnDesc = column.columnDesc
            columnObj.nullable = column.nullable
            columnObj.dataType = column.dataType
            columnObj.aggregateable = column.aggregateable
            columnObj.aggrRule = column.aggrRule
            self.tokens[path]['rootObject'].schema[i].add_column(columnObj)
            return 'Pass'

    def delSchema(self,path,schema,uid):
        if self.tokensControl(path, uid) == 'Token Conflict':
            return 'Token Conflict'
        else:
            self.tokens = self.tokensControl(path, uid)
            schemaObjs = self.tokens[path]['rootObject'].schema
            print schemaObjs
            for schemaObj in schemaObjs:
                if schemaObj.schemaName == schema.schemaName:
                    schemaObjs.remove(schemaObj)
            return 'Pass'
            
    def delColumn(self, schemaName, column, path, uid):
        if self.tokensControl(path, uid) == 'Token Conflict':
            return 'Token Conflict'
        else:
            self.tokens = self.tokensControl(path, uid)
            i = self.getSchemaIndex(schemaName,self.tokens[path]['rootObject'])
            schema = self.tokens[path]['rootObject'].schema[i]
            columnName = column.columnName
            columnObjs = schema.column
            for columnObj in columnObjs:
                if columnObj.columnName == columnName:
                    columnObjs.remove(columnObj)
            return 'Pass'
          
    def getSchemaIndex(self, name, rootObject):
        schemas = rootObject.schema
        for schema in schemas:
            if schema.schemaName == name:
                return schemas.index(schema)
                break

    def getColumnIndex(self, schema, columnName):
        columnObjs = schema.column
        for columnObj in columnObjs:
            if columnObj.columnName == columnName:
                return columnObjs.index(columnObj)
                break

    def tokensControl(self, path, uid):
        if path not in self.tokens:
            rootObject = metadata.parse(path)
            token = {'uid':uid,'rootObject':rootObject,'time':time.time()}
            self.tokens[path] = token
        elif path in self.tokens:
            if uid == self.tokens[path]['uid']:
                self.tokens[path]['time'] = time.time()
            elif uid != self.tokens[path]['uid']:
                if (time.time()-self.tokens[path]['time'])>3600:
                    del self.tokens[path]
                    rootObject = metadata.parse(path)
                    token = {'uid':uid,'rootObject':rootObject,'time':time.time()}
                    self.tokens[path] = token
                else:
                    return 'Token Conflict'
        return self.tokens
