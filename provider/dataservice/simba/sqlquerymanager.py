import simbaStruct
import tempfile
import sys
import copy

def comb(items, n=None):
    if n is None:
        n = len(items)    
    for i in range(len(items)):
        v = items[i:i+1]
        if n == 1:
            yield v
        else:
            rest = items[i+1:]
            for c in comb(rest, n-1):
                yield v + c

class SQLQueryManager(object):
    def __init__(self,requestXml=None,prompts=None,viewName=None,viewType=None,sql=None,resultXml=None):
        self.requestXml = requestXml
        self.prompts = prompts
        self.viewName = viewName
        self.viewType = viewType
        self.sql = sql
        self.resultXml = resultXml
    def get_requestXml(self):return self.requestXml
    def set_requestXml(self):self.requestXml = requestXml
    def get_prompts(self):return self.prompts
    def set_prompts(self):self.prompts = prompts
    def get_viewName(self):return self.viewName
    def set_viewName(self):self.viewName = viewName
    def get_viewType(self):return self.viewType
    def set_viewType(self):self.viewType = viewType
    def get_sql(self):return self.sql
    def set_sql(self):self.sql = sql
    def get_resultXml(self):return self.resultXml
    def set_resultXml(self):self.resultXml = resultXml
    def generateResultXml(self):
        srcSimbaXmlObj = simbaStruct.parseString(self.requestXml)
        srcCriteriaObj = srcSimbaXmlObj.application.report.criteria[0]
        srcSql = srcCriteriaObj.sql
        if self.prompts is not None:
            resultSql = self.generatePromptResultSql(srcSql)
        elif self.viewType is not None and self.viewType=='chart':
            resultSql = self.generateChartResultSql(srcSql,srcSimbaXmlObj)
            resultSql = self.obtainPromptAllResultSql(resultSql)
        elif self.viewType is not None and self.viewType=='pivottable':
            resultSql = self.generatePivotResultSql(srcSql,srcSimbaXmlObj)
            resultSql = self.obtainPromptAllResultSql(resultSql)
        else:
            resultSql = srcSql
            resultSql = self.obtainPromptAllResultSql(resultSql)
        srcCriteriaObj.sql = resultSql
        tfile = tempfile.TemporaryFile()
        srcSimbaXmlObj.export(tfile,0)
        tfile.seek(0)
        self.resultXml = tfile.read()
    def generatePromptResultSql(self,srcSql):
        srcSqlElements = srcSql.split('\n')
        for i in range(len(srcSqlElements)):
            if srcSqlElements[i].find(':PQ') != -1:
                srcSqlFilterFormula = srcSqlElements[i].split(' LIKE ')[0]
                for prompt in self.prompts:
                    if prompt['formula'] == srcSqlFilterFormula.replace('"',''):
                        if prompt['control'] == 'edit':
                            filterCondition = self.editControl(prompt, srcSqlElements[i])
                        elif prompt['control'] == 'drop':
                            filterCondition = self.dropControl(prompt, srcSqlElements[i])
                        elif prompt['control'] == 'multi':
                            filterCondition = self.multiControl(prompt, srcSqlElements[i])
                        elif prompt['control'] == 'calendar':
                            filterCondition = self.calendarControl(prompt, srcSqlElements[i])
                        if ' AND' in srcSqlElements[i]:
                            srcSqlElements[i] = filterCondition+" AND"
                        else:
                            srcSqlElements[i] = filterCondition
        resultSql = "\r\n".join(srcSqlElements)
        self.sql = resultSql
        return resultSql
    def obtainPromptAllResultSql(self,resultSql):
        resultSqlElements = resultSql.split('\n')
        for i in range(len(resultSqlElements)):
            if resultSqlElements[i].find(':PQ') != -1:
                if ' AND' in resultSqlElements[i]:
                    resultSqlElements[i] = '1=1 AND'
                else:
                    resultSqlElements[i] = '1=1'
        resultSql = "\r\n".join(resultSqlElements)
        self.sql = resultSql
        return resultSql
    def editControl(self, prompt, srcSqlElement):
        if prompt["operator"] == "between":
            filterCondition = self.betweenOperator(prompt)
        else:
            filterCondition = self.handlePromptValue(prompt)
        return filterCondition
    def dropControl(self, prompt, srcSqlElement):
        if prompt["operator"] == "between":
            filterCondition = self.betweenOperator(prompt)
        else:
            if prompt["value"] == 'allChoices':
                filterCondition = self.allChoicesValue(prompt)
            else:
                filterCondition = self.handlePromptValue(prompt)
        return filterCondition
    def multiControl(self, prompt, srcSqlElement):
        if prompt["value"] == 'allChoices':
            filterCondition = self.allChoicesValue(prompt)
        else:
            promptValues = prompt["value"].split(', ')
            promptNullValue = None
            if '(NULL)' in promptValues:
                promptNullValue = prompt["formula"]+" IS NULL"
                promptValues.remove('(NULL)')
            if '(BLANK)' in promptValues:
                promptValues.remove('(BLANK)')
                promptValues.append('')
            promptValue = "('"+"', '".join(promptValues)+"')"
            if promptNullValue and promptValues != []:
                filterCondition = "("+prompt["formula"]+" "+prompt["operator"]+" "+promptValue+" OR "+promptNullValue+")"
            elif promptNullValue and promptValues == []:
                filterCondition = promptNullValue
            else:
                if prompt["operator"] == 'notIn':
                    operator = 'NOT IN'
                else:
                    operator = 'IN'
                filterCondition = prompt["formula"]+" "+operator+" "+promptValue
        return filterCondition
    def calendarControl(self, prompt, srcSqlElement):
        if prompt["operator"] == "between":
            values= prompt["value"].split("---to---")
            value1 = values[0]
            value2 = values[1]
            filterCondition = prompt["formula"]+" "+"BETWEEN"+" TIMESTAMP '"+value1+"' AND TIMESTAMP '"+value2+"'"
        else:
            filterCondition = prompt["formula"]+" "+prompt["operator"]+" ( TIMESTAMP '"+prompt["value"]+"') "
        return filterCondition
    def betweenOperator(self, prompt):
        values= prompt["value"].split("---to---")
        value1 = values[0]
        value2 = values[1]
        filterCondition = prompt["formula"]+" "+"BETWEEN"+" '"+value1+"' AND '"+value2+"'"
        return filterCondition
    def allChoicesValue(self, prompt):
        filterCondition = '1=1'
        return filterCondition
    def handlePromptValue(self,prompt):
        if prompt["value"] == '(NULL)':
            filterCondition = prompt["formula"]+" IS NULL"
        elif prompt["value"] == '(BLANK)':
##            filterCondition = prompt["formula"]+" "+prompt["operator"]+" ('')"
            filterCondition = self.handlePromptFilterCondition(prompt["formula"],prompt["operator"],'')
        else:
##            filterCondition = prompt["formula"]+" "+prompt["operator"]+" ('"+prompt["value"]+"')"
            filterCondition = self.handlePromptFilterCondition(prompt["formula"],prompt["operator"],prompt["value"])
        return filterCondition
    def handlePromptFilterCondition(self,formula,op,value):
        if op == 'in':
            operator = 'IN'
            filterCondition = formula+" "+operator+" ('"+value+"')"
        elif op == 'notIn':
            operator = 'NOT IN'
            filterCondition = formula+" "+operator+" ('"+value+"')"
        elif op == 'less':
            operator = '<'
            filterCondition = formula+" "+operator+" "+value
        elif op == 'greater':
            operator = '>'
            filterCondition = formula+" "+operator+" "+value
        elif op == 'lessOrEqual':
            operator = '<='
            filterCondition = formula+" "+operator+" "+value
        elif op == 'greaterOrEqual':
            operator = '>='
            filterCondition = formula+" "+operator+" "+value
        elif op == 'containsAny':
            operator = 'LIKE'
            filterCondition = formula+" "+operator+" ('%"+value+"%')"
        elif op == 'beginsWith':
            operator = 'LIKE'
            filterCondition = formula+" "+operator+" ('"+value+"%')"
        elif op == 'endsWith':
            operator = 'LIKE'
            filterCondition = formula+" "+operator+" ('%"+value+"')"
        elif op == 'notLike':
            operator = 'NOT LIKE'
            filterCondition = formula+" "+operator+" ('%"+value+"%')"
        elif op == 'like':
            operator = 'LIKE'
            filterCondition = formula+" "+operator+" ('%"+value+"%')"
        else:
            filterCondition = 'The operator cannot be identified'
        return filterCondition            

    def generateChartResultSql(self,srcSql,srcSimbaXmlObj):
        dimColIDs=[]
        factColIDs=[]
        groupBy = ''
        resultSql = "SELECT\r\n"
        chartObjs = srcSimbaXmlObj.application.report.views.chart
        for chartObj in chartObjs:
            if chartObj.name == self.viewName:
                if chartObj.chartType == 'gaugeChart':
                    if chartObj.gaugePointers:
                        if chartObj.gaugePointers.pointer:
                            gaugePointerObjs = chartObj.gaugePointers.pointer
                            for gaugePointerObj in gaugePointerObjs:
                                gaugePointerColID = gaugePointerObj.column.columnId
                                if gaugePointerObj.column.aggRule:
                                    if gaugePointerObj.column.aggRule == 'count':
                                        resultSql = resultSql+gaugePointerObj.column.aggRule+'(1) '+gaugePointerColID+',\r\n'
                                    else:
                                        resultSql = resultSql+gaugePointerObj.column.aggRule+'(t1.'+gaugePointerColID+') '+gaugePointerColID+',\r\n'
                                else:
                                    resultSql = resultSql+'SUM(t1.'+gaugePointerColID+') '+gaugePointerColID+',\r\n'
                    if chartObj.gaugeTitles:
                        gaugeTitlesColObjs = chartObj.gaugeTitles.column
                        for gaugeTitlesColObj in gaugeTitlesColObjs:
                            gaugeTitlesColID = gaugeTitlesColObj.columnId
                            resultSql = resultSql+'t1.'+gaugeTitlesColID+' '+gaugeTitlesColID+',\r\n'
                            groupBy = groupBy+'t1.'+gaugeTitlesColID+',\r\n'
                else:            
                    if chartObj.seriesGenerators:
                        chartSeriesGeneratorsObj = chartObj.seriesGenerators
                        chartSeriesGeneratorsColObjs = chartSeriesGeneratorsObj.column
                        for chartSeriesGeneratorsColObj in chartSeriesGeneratorsColObjs:
                            chartSeriesGeneratorsColID = chartSeriesGeneratorsColObj.columnId
                            dimColIDs.append(chartSeriesGeneratorsColID)
                            resultSql = resultSql+'t1.'+chartSeriesGeneratorsColID+' '+chartSeriesGeneratorsColID+',\r\n'
                            groupBy = groupBy+'t1.'+chartSeriesGeneratorsColID+',\r\n'
                    if chartObj.categories:
                        chartCategoriesObj = chartObj.categories
                        categoryObjs = chartCategoriesObj.category
                        for categoryObj in categoryObjs:
                            categoryColObjs = categoryObj.column
                            for categoryColObj in categoryColObjs:
                                categoryColID = categoryColObj.columnId
                                dimColIDs.append(categoryColID)
                                resultSql = resultSql+'t1.'+categoryColID+' '+categoryColID+',\r\n'
                                groupBy = groupBy+'t1.'+categoryColID+',\r\n'
                    measuresObj = chartObj.measures
                    measureColObjs = measuresObj.column
                    for measureColObj in measureColObjs:
                        measureColID = measureColObj.columnId
                        factColIDs.append(measureColID)
                        if measureColObj.aggRule:
                            if measureColObj.aggRule == 'count':
                                resultSql = resultSql+measureColObj.aggRule+'(1) '+measureColID+',\r\n'
                            else:
                                resultSql = resultSql+measureColObj.aggRule+'(t1.'+measureColID+') '+measureColID+',\r\n'
                        else:
                            resultSql = resultSql+'SUM(t1.'+measureColID+') '+measureColID+',\r\n'
        resultSql = resultSql.rstrip(',\r\n')
        resultSql = resultSql+'\r\n'
        resultSql = resultSql+'FROM\r\n('+srcSql+') t1 \r\nGROUP BY\r\n'
        resultSql = resultSql+groupBy
        resultSql = resultSql.rstrip(',\r\n')
        resultSql = resultSql+'\r\n'
        return resultSql
    
    def generatePivotResultSql(self,srcSql,srcSimbaXmlObj):
        pivotDimEdges = {}
        pivotEdgeCols = {}
        pivotObjs = srcSimbaXmlObj.application.report.views.pivotTable
        for pivotObj in pivotObjs:
            if pivotObj.name == self.viewName:
                pivotEdgeObjs = pivotObj.edge
                for pivotEdgeObj in pivotEdgeObjs:
                    pivotEdgeAxis = pivotEdgeObj.axis
                    pivotEdgeTotal = pivotEdgeObj.total
                    pivotEdgeColObjs = pivotEdgeObj.column
                    if pivotEdgeAxis!='measure' and pivotEdgeColObjs != []:
                        if pivotEdgeTotal:
                            pivotDimEdges[pivotEdgeAxis]=1
                        else:
                            pivotDimEdges[pivotEdgeAxis]=0
                        edgeDimColumns = []
                        for pivotEdgeColObj in pivotEdgeColObjs:
                           edgeDimColumns.append(pivotEdgeColObj.columnId)
                        pivotEdgeCols[pivotEdgeAxis] = edgeDimColumns
                    elif pivotEdgeAxis=='measure' and pivotEdgeColObjs != []:
                        edgeFactColumns = {}
                        for pivotEdgeColObj in pivotEdgeColObjs:
                            edgeFactColumns[pivotEdgeColObj.columnId] = pivotEdgeColObj.aggRule
                        pivotEdgeCols[pivotEdgeAxis] = edgeFactColumns
        measuresBy_SQLs = self.getpivotCombMeasuresBySQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        resultSelectSql = 'SELECT\r\n'
        resultFromSql = 'FROM\r\n'
        baseGroupbyQueryAlias = ''
        totalGroupbyQueryAlias = ''
        for groupbyQueryAlias in measuresBy_SQLs:
            groupby = []
            if sorted(pivotDimEdges.keys()) == sorted(measuresBy_SQLs[groupbyQueryAlias]['groupByEdges']):
                for groupByEdge in measuresBy_SQLs[groupbyQueryAlias]['groupByEdges']:
                    for pivotEdgeCol in pivotEdgeCols[groupByEdge]:
                        resultSelectSql = resultSelectSql+groupbyQueryAlias+'.'+pivotEdgeCol+' '+pivotEdgeCol+',\r\n'
                        groupby.append(pivotEdgeCol)
                groupby = ','.join(sorted(groupby))
                for pivotMeasureCol in pivotEdgeCols['measure']:
                    resultSelectSql = resultSelectSql+groupbyQueryAlias+'.'+pivotMeasureCol+' "'+pivotMeasureCol+','+groupby+'",\r\n'
                resultFromSql = resultFromSql+'('+measuresBy_SQLs[groupbyQueryAlias]['SQL']+') '+groupbyQueryAlias+'\r\n'
                baseGroupbyQueryAlias=groupbyQueryAlias
        if baseGroupbyQueryAlias:
            measuresBy_SQLs.pop(baseGroupbyQueryAlias)
        for groupbyQueryAlias in measuresBy_SQLs:
            if measuresBy_SQLs[groupbyQueryAlias]['groupByEdges'] == []:
                for pivotMeasureCol in pivotEdgeCols['measure']:
                    resultSelectSql = resultSelectSql+groupbyQueryAlias+'.'+pivotMeasureCol+' '+pivotMeasureCol+',\r\n'
                resultFromSql=resultFromSql+'JOIN ('+measuresBy_SQLs[groupbyQueryAlias]['SQL']+') '+groupbyQueryAlias+'\r\n'+'ON\r\n 1=1\r\n'
                totalGroupbyQueryAlias = groupbyQueryAlias
        if totalGroupbyQueryAlias:
            measuresBy_SQLs.pop(totalGroupbyQueryAlias)
        for groupbyQueryAlias in measuresBy_SQLs:
            resultJoinSql = 'ON\r\n'
            groupby = []
            for groupByEdge in measuresBy_SQLs[groupbyQueryAlias]['groupByEdges']:
                for pivotEdgeCol in pivotEdgeCols[groupByEdge]:
                    resultJoinSql = resultJoinSql+baseGroupbyQueryAlias+'.'+pivotEdgeCol+'='+groupbyQueryAlias+'.'+pivotEdgeCol+' AND\r\n'
                    groupby.append(pivotEdgeCol)
            groupby = ','.join(sorted(groupby))
            for pivotMeasureCol in pivotEdgeCols['measure']:
                resultSelectSql = resultSelectSql+groupbyQueryAlias+'.'+pivotMeasureCol+' "'+pivotMeasureCol+','+groupby+'",\r\n'
            resultJoinSql = resultJoinSql.rstrip(' AND\r\n')
            resultJoinSql = resultJoinSql+'\r\n'
            resultFromSql=resultFromSql+'JOIN ('+measuresBy_SQLs[groupbyQueryAlias]['SQL']+') '+groupbyQueryAlias+'\r\n'+resultJoinSql
        resultSelectSql = resultSelectSql.rstrip(',\r\n')
        resultSelectSql = resultSelectSql+'\r\n'
        resultSql = resultSelectSql+resultFromSql
        return resultSql
    def getpivotCombMeasuresBySQLs(self,pivotDimEdges,pivotEdgeCols,srcSql):
        if cmp(pivotDimEdges,{'page':0,'section':0,'column':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':0,'column':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':0,'column':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':1,'column':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':0,'column':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':0,'column':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':1,'column':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':0,'column':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':1,'column':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)        
        elif cmp(pivotDimEdges,{'page':1,'section':0,'column':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':1,'column':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)        
        elif cmp(pivotDimEdges,{'page':0,'section':1,'column':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':0,'column':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':1,'column':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':1,'column':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':1,'column':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':0,'column':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':0,'column':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':0,'column':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':1,'column':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':0,'column':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':1,'column':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':1,'column':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':1,'column':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'column':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'column':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'column':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'column':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'column':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'column':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'column':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'column':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':0,'column':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':0,'column':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':1,'column':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':0,'column':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':1,'column':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':0,'column':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':1,'column':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':1,'column':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'section':1,})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'section':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'column':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'column':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'column':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'column':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':0,'column':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':0,'column':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':1,'column':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':1,'column':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'column':0,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'column':0,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'column':1,'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'column':1,'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'page':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'section':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'column':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'column':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'row':0})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        elif cmp(pivotDimEdges,{'row':1})==0:
            measuresBy_SQLs = self.getMeasuresBy_SQLs(pivotDimEdges,pivotEdgeCols,srcSql)
        return measuresBy_SQLs
    def getMeasuresBy_SQLs(self,pivotDimEdges,pivotEdgeCols,srcSql):
        measuresBy_SQLs = {}
        edges = pivotDimEdges.keys()
        groupBy_EdgesRelevants = self.getRelevantGroupBy_Edges(edges,pivotDimEdges)
        for groupBy_EdgesRelevant in groupBy_EdgesRelevants:
            groupbyQueryAlias = self.getGroupbyAlias(groupBy_EdgesRelevant)
            measuresBy_SQL = self.generateMeasuresBy_SQL(pivotEdgeCols,srcSql,groupBy_EdgesRelevant)
            measuresBy_SQLs[groupbyQueryAlias]=measuresBy_SQL
        return measuresBy_SQLs
    def getRelevantGroupBy_Edges(self,edges,pivotDimEdges):
        groupBy_EdgesAll = []
        for selection in range(1, len(edges)):
            enum = comb(edges, selection)
            for i in enum:
                groupBy_EdgesAll.append(sorted(i))
        if 0 not in pivotDimEdges.values():
            groupBy_EdgesAll.append([])
        groupBy_EdgesAll.append(sorted(edges))
        groupBy_EdgesRelevants = copy.copy(groupBy_EdgesAll)
        for key in pivotDimEdges:
            if pivotDimEdges[key] == 0:
                for groupBy_EdgesOne in groupBy_EdgesAll:
                    if key not in groupBy_EdgesOne and groupBy_EdgesOne in groupBy_EdgesRelevants:
                        groupBy_EdgesRelevants.remove(groupBy_EdgesOne)
        return groupBy_EdgesRelevants
    def generateMeasuresBy_SQL(self,pivotEdgeCols,srcSql,groupBy_Edges):
        measuresBy_SQL = {}
        SQL = "SELECT\r\n"
        measuresBy_groupby = ''
        for key in pivotEdgeCols:
            if key in groupBy_Edges:
                SQL = self.getDimColsFromEdge(key,pivotEdgeCols,SQL)
                measuresBy_groupby = self.getGroupbyColsFromEdge(key,pivotEdgeCols,measuresBy_groupby)
            elif key == 'measure':
                SQL = self.getFactColsFromEdge(key,pivotEdgeCols,SQL)
        SQL = self.concateMeasuresBy_SQL(SQL,srcSql,measuresBy_groupby)
        measuresBy_SQL['SQL'] = SQL
        measuresBy_SQL['groupByEdges'] = groupBy_Edges
        return measuresBy_SQL
    def getDimColsFromEdge(self,key,pivotEdgeCols,SQL):
        cols = pivotEdgeCols[key]
        for col in cols:
            SQL = SQL+'src.'+col+' '+col+',\r\n'
        return SQL
    def getGroupbyColsFromEdge(self,key,pivotEdgeCols,measuresBy_groupby):
        cols = pivotEdgeCols[key]
        for col in cols:
            measuresBy_groupby = measuresBy_groupby+'src.'+col+',\r\n'
        return measuresBy_groupby
    def getFactColsFromEdge(self,key,pivotEdgeCols,SQL):
        measureCols = pivotEdgeCols[key]
        for key in measureCols:
            if measureCols[key]:
                if measureCols[key] == 'count':
                    SQL = SQL+measureCols[key]+'(1) '+key+',\r\n'
                else:
                    SQL = SQL+measureCols[key]+'(src.'+key+') '+key+',\r\n'
            else:
                SQL = SQL+'SUM'+'(src.'+key+') '+key+',\r\n'
        return SQL
    def concateMeasuresBy_SQL(self,measuresBy_SQL,srcSql,measuresBy_groupby):
        measuresBy_SQL = measuresBy_SQL.rstrip(',\r\n')
        measuresBy_SQL = measuresBy_SQL+'\r\n'
        measuresBy_SQL = measuresBy_SQL+'FROM\r\n('+srcSql+') src\r\n'
        if measuresBy_groupby != '':
            measuresBy_SQL = measuresBy_SQL+'GROUP BY\r\n'+measuresBy_groupby
            measuresBy_SQL = measuresBy_SQL.rstrip(',\r\n')
            measuresBy_SQL = measuresBy_SQL+'\r\n'
        return measuresBy_SQL
    def getGroupbyAlias(self,groupBy_Edges):
        if sorted(['page','section','column','row'])==sorted(groupBy_Edges):
            groupbyAlias = 'TPSCR'
        elif sorted(['page','section','column'])==sorted(groupBy_Edges):
            groupbyAlias = 'TPSC'
        elif sorted(['page','section','row'])==sorted(groupBy_Edges):
            groupbyAlias = 'TPSR'
        elif sorted(['page','column','row'])==sorted(groupBy_Edges):
            groupbyAlias = 'TPCR'
        elif sorted(['section','column','row'])==sorted(groupBy_Edges):
            groupbyAlias = 'TSCR'
        elif sorted(['page','section'])==sorted(groupBy_Edges):
            groupbyAlias = 'TPS'
        elif sorted(['page','column'])==sorted(groupBy_Edges):
            groupbyAlias = 'TPC'
        elif sorted(['section','column'])==sorted(groupBy_Edges):
            groupbyAlias = 'TSC'
        elif sorted(['page','row'])==sorted(groupBy_Edges):
            groupbyAlias = 'TPR'
        elif sorted(['section','row'])==sorted(groupBy_Edges):
            groupbyAlias = 'TSR'
        elif sorted(['column','row'])==sorted(groupBy_Edges):
            groupbyAlias = 'TCR'
        elif ['page']==groupBy_Edges:
            groupbyAlias = 'TP'
        elif ['section']==groupBy_Edges:
            groupbyAlias = 'TS'
        elif ['column']==groupBy_Edges:
            groupbyAlias = 'TC'
        elif ['row']==groupBy_Edges:
            groupbyAlias = 'TR'
        elif []==groupBy_Edges:
            groupbyAlias = 'TOTAL'
        return groupbyAlias  
