import sys
from obiee10gquerymanager import *
from sqlquerymanager import *

class QueryManager(object):
    def __init__(self,appName=None,savedFilters=None,prompts=None,columnSelector=None,drillColumn=None,requestXml=None,viewName=None,viewType=None,sql=None,resultXml=None):
        self.appName = appName
        self.savedFilters = savedFilters
        self.prompts = prompts
        self.columnSelector = columnSelector
        self.drillColumn = drillColumn
        self.requestXml = requestXml
        self.viewName = viewName
        self.viewType = viewType
        self.sql = sql
        self.resultXml = resultXml
    def get_appName(self):return self.appName
    def set_appName(self):self.appName = appName
    def get_saveFilters(self):return self.saveFilters
    def set_saveFilters(self):self.saveFilters = saveFilters
    def get_prompts(self):return self.prompts
    def set_prompts(self):self.prompts = prompts
    def get_columnSelector(self):return self.columnSelector
    def set_columnSelector(self):self.columnSelector = columnSelector
    def get_drillColumn(self):return self.drillColumn
    def set_drillColumn(self):self.drillColumn = drillColumn
    def get_requestXml(self):return self.requestXml
    def set_requestXml(self):self.requestXml = requestXml
    def get_viewName(self):return self.viewName
    def set_viewName(self):self.viewName = viewName
    def get_viewType(self):return self.viewType
    def set_viewType(self):self.viewType = viewType
    def get_sql(self):return self.sql
    def set_sql(self):self.sql = sql
    def get_resultXml(self):return self.resultXml
    def set_resultXml(self):self.resultXml = resultXml
    def generateResults(self):
        if self.appName == 'obiee10g':
            queryManagerObj = OBIEE10gQueryManager(self.savedFilters,self.prompts,self.columnSelector,self.drillColumn,self.requestXml)
        elif self.appName == 'sql':
            queryManagerObj = SQLQueryManager(self.requestXml,self.prompts,self.viewName,self.viewType,self.sql,self.requestXml)
            queryManagerObj.generateResultXml()
        return queryManagerObj
