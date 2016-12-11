povitDimEdges = {'page':1,'section':1,'column':1,'row':1}
povitEdgeCols = {'page':['pageCol'],'section':['sectionCol'],'column':['columnCol'],'row':['rowCol'],'measure':{'measure1':'sum','measure2':'count'}}
srcSql = 'SELECT pageCol,sectionCol FROM table'
import copy

def povitCombinator(povitDimEdges,povitEdgeCols,srcSql):
    if cmp(povitDimEdges,{'page':0,'section':0,'column':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':0,'column':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':0,'column':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':1,'column':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':0,'column':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':0,'column':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':1,'column':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':0,'column':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':1,'column':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)        
    elif cmp(povitDimEdges,{'page':1,'section':0,'column':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':1,'column':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)        
    elif cmp(povitDimEdges,{'page':0,'section':1,'column':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':0,'column':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':1,'column':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':1,'column':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':1,'column':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':0,'column':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':0,'column':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':0,'column':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':1,'column':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':0,'column':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':1,'column':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':1,'column':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':1,'column':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'column':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'column':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'column':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'column':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'column':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'column':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'column':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'column':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':0,'column':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':0,'column':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':1,'column':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':0,'column':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':1,'column':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':0,'column':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':1,'column':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':1,'column':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':1,})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'column':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'column':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'column':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'column':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':0,'column':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':0,'column':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':1,'column':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':1,'column':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'column':0,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'column':0,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'column':1,'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'column':1,'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'section':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'column':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'column':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'row':0})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'row':1})==0:
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    resultSelectSql = 'SELECT\r\n'
    resultFromSql = 'FROM\r\n'
    baseGroupbyQueryAlias = ''
    totalGroupbyQueryAlias = ''
    for groupbyQueryAlias in measuresBy_SQLs:
        groupby = ''
        if sorted(povitDimEdges.keys()) == sorted(measuresBy_SQLs[groupbyQueryAlias]['groupByEdges']):
            for groupByEdge in measuresBy_SQLs[groupbyQueryAlias]['groupByEdges']:
                for povitEdgeCol in povitEdgeCols[groupByEdge]:
                    resultSelectSql = resultSelectSql+groupbyQueryAlias+'.'+povitEdgeCol+' '+povitEdgeCol+',\r\n'
                    if groupby!='':
                        groupby = groupby+','+povitEdgeCol
                    else:
                        groupby = povitEdgeCol
            for povitMeasureCol in povitEdgeCols['measure']:
                resultSelectSql = resultSelectSql+groupbyQueryAlias+'.'+povitMeasureCol+' "'+povitMeasureCol+','+groupby+'",\r\n'
            resultFromSql = resultFromSql+'('+measuresBy_SQLs[groupbyQueryAlias]['SQL']+') '+groupbyQueryAlias+'\r\n'
            baseGroupbyQueryAlias=groupbyQueryAlias
    if baseGroupbyQueryAlias:
        measuresBy_SQLs.pop(baseGroupbyQueryAlias)
    for groupbyQueryAlias in measuresBy_SQLs:
        if measuresBy_SQLs[groupbyQueryAlias]['groupByEdges'] == []:
            for povitMeasureCol in povitEdgeCols['measure']:
                resultSelectSql = resultSelectSql+groupbyQueryAlias+'.'+povitMeasureCol+' '+povitMeasureCol+',\r\n'
            resultFromSql=resultFromSql+'JOIN ('+measuresBy_SQLs[groupbyQueryAlias]['SQL']+') '+groupbyQueryAlias+'\r\n'
            totalGroupbyQueryAlias = groupbyQueryAlias
    if totalGroupbyQueryAlias:
        measuresBy_SQLs.pop(totalGroupbyQueryAlias)
    for groupbyQueryAlias in measuresBy_SQLs:
        resultJoinSql = 'ON\r\n'
        groupby = ''
        for groupByEdge in measuresBy_SQLs[groupbyQueryAlias]['groupByEdges']:
            for povitEdgeCol in povitEdgeCols[groupByEdge]:
##                resultSelectSql = resultSelectSql+groupbyQueryAlias+'.'+povitEdgeCol+' '+povitEdgeCol+',\r\n'
                resultJoinSql = resultJoinSql+baseGroupbyQueryAlias+'.'+povitEdgeCol+'='+groupbyQueryAlias+'.'+povitEdgeCol+' AND\r\n'
                if groupby!='':
                    groupby = groupby+','+povitEdgeCol
                else:
                    groupby = povitEdgeCol
        for povitMeasureCol in povitEdgeCols['measure']:
            resultSelectSql = resultSelectSql+groupbyQueryAlias+'.'+povitMeasureCol+' "'+povitMeasureCol+','+groupby+'",\r\n'
        resultJoinSql = resultJoinSql.rstrip(' AND\r\n')
        resultJoinSql = resultJoinSql+'\r\n'
        resultFromSql=resultFromSql+'JOIN ('+measuresBy_SQLs[groupbyQueryAlias]['SQL']+') '+groupbyQueryAlias+'\r\n'+resultJoinSql
    resultSelectSql = resultSelectSql.rstrip(',\r\n')
    resultSelectSql = resultSelectSql+'\r\n'
    resultSql = resultSelectSql+resultFromSql
##    resultSql = "\r\n".join(measuresBy_SQLs)
    return resultSql

def getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql):
    measuresBy_SQLs = {}
    edges = povitDimEdges.keys()
    groupBy_EdgesRelevants = getRelevantGroupBy_Edges(edges,povitDimEdges)
    for groupBy_EdgesRelevant in groupBy_EdgesRelevants:
        groupbyQueryAlias = getGroupbyAlias(groupBy_EdgesRelevant)
        measuresBy_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBy_EdgesRelevant)
##        joinCols = []
##        for groupByEdge in groupBy_EdgesRelevant:
##            for edge in povitEdgeCols:
##                if groupByEdge == edge:
##                    for edgeCol in povitEdgeCols[edge]:
##                        joinCols.append(edgeCol)
##        measuresBy_SQL['SQL']=generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBy_EdgesRelevant)
##        measuresBy_SQL['joinColumns'] = joinCols
##        measuresBy_SQL['groupByEdges'] = groupBy_EdgesRelevant
        measuresBy_SQLs[groupbyQueryAlias]=measuresBy_SQL
    return measuresBy_SQLs

def getRelevantGroupBy_Edges(edges,povitDimEdges):
    groupBy_EdgesAll = []
    for selection in range(1, len(edges)):
        enum = comb(edges, selection)
        for i in enum:
            groupBy_EdgesAll.append(sorted(i))
    if 0 not in povitDimEdges.values():
        groupBy_EdgesAll.append([])
    groupBy_EdgesAll.append(sorted(edges))
    groupBy_EdgesRelevants = copy.copy(groupBy_EdgesAll)
    for key in povitDimEdges:
        if povitDimEdges[key] == 0:
            for groupBy_EdgesOne in groupBy_EdgesAll:
                if key not in groupBy_EdgesOne and groupBy_EdgesOne in groupBy_EdgesRelevants:
                    groupBy_EdgesRelevants.remove(groupBy_EdgesOne)
    return groupBy_EdgesRelevants

def generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBy_Edges):
    measuresBy_SQL = {}
    SQL = "SELECT\r\n"
    measuresBy_groupby = ''
    for key in povitEdgeCols:
        if key in groupBy_Edges:
            SQL = getDimColsFromEdge(key,povitEdgeCols,SQL)
            measuresBy_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresBy_groupby)
        elif key == 'measure':
            SQL = getFactColsFromEdge(key,povitEdgeCols,SQL)
    SQL = concateMeasuresBy_SQL(SQL,srcSql,measuresBy_groupby)
    measuresBy_SQL['SQL'] = SQL
    measuresBy_SQL['groupByEdges'] = groupBy_Edges
    return measuresBy_SQL

def getDimColsFromEdge(key,povitEdgeCol,SQL):
    cols = povitEdgeCols[key]
    for col in cols:
        SQL = SQL+'src.'+col+' '+col+',\r\n'
    return SQL

def getGroupbyColsFromEdge(key,povitEdgeCols,measuresBy_groupby):
    cols = povitEdgeCols[key]
    for col in cols:
        measuresBy_groupby = measuresBy_groupby+'src.'+col+',\r\n'
    return measuresBy_groupby

def getFactColsFromEdge(key,povitEdgeCols,SQL):
    measureCols = povitEdgeCols[key]
    for key in measureCols:
        SQL = SQL+measureCols[key]+'(src.'+key+') '+key+',\r\n'
    return SQL

def concateMeasuresBy_SQL(measuresBy_SQL,srcSql,measuresBy_groupby):
    measuresBy_SQL = measuresBy_SQL.rstrip(',\r\n')
    measuresBy_SQL = measuresBy_SQL+'\r\n'
    measuresBy_SQL = measuresBy_SQL+'FROM\r\n('+srcSql+') src\r\n'
    if measuresBy_groupby != '':
        measuresBy_SQL = measuresBy_SQL+'GROUP BY\r\n'+measuresBy_groupby
        measuresBy_SQL = measuresBy_SQL.rstrip(',\r\n')
        measuresBy_SQL = measuresBy_SQL+'\r\n'
    return measuresBy_SQL

def getGroupbyAlias(groupBy_Edges):
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



