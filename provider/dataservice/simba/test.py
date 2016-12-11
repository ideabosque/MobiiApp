def combinators(s) :
 
    if len(s) == 1 :
 
        def gen(lst) :
 
            yield []
 
            yield [lst[0],]
 
    else :
 
        def gen(a) :
 
            lst = a[:]
 
            item = lst.pop()
 
            for i in combinator(lst) :
 
                b = i[:]
 
                c = i[:]
 
                c.append(item)
 
                yield b
 
                yield c
 
    g = gen(s)
 
    return g


def fun(arr):
    count = len(arr)
    max_num = 1 << count;
    print range(max_num)
 
    rst = []
    for i in range(max_num):
        tmp = 1
        s = []
        for j in range(count):
            if tmp & i != 0:
                s.append(arr[j])
                tmp *= 2
        print s
        rst.append(s)
    return rst

def combinator(m,n):
    combLables = {}
    for i in range(len(m)):
        combLables[i] = 0
    for j in range(n):
        combLables[j] = 1
    tmp = 1
    for k in range(len(combLables)):
        if tmp == 1 & combLables[k] == 0:
            tmp = combLables[k]
            combLables[k] = 1
            combLables[k-1] = tmp
    print combLables
        
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

        
    
    



   
povitDimEdges = {'page':1,'section':1,'column':1,'row':1}
povitEdgeCols = {'page':['pageCol'],'section':['sectionCol'],'column':['columnCol'],'row':['rowCol'],'measure':{'measure1':'sum','measure2':'count'}}

def povitCombinator(povitDimEdges,povitEdgeCols,srcSql):
    groupByPSCR_Edges = ['page','section','column','row']
    groupByPSC_Edges = ['page','section','column']
    groupByPSR_Edges = ['page','section','row']
    groupByPCR_Edges = ['page','column','row']
    groupBySCR_Edges = ['section','column','row']
    groupByPS_Edges = ['page','section']
    groupByPC_Edges = ['page','column']
    groupBySC_Edges = ['section','column']
    groupByPR_Edges = ['page','row']
    groupBySR_Edges = ['section','row']
    groupByCR_Edges = ['column','row']
    groupByP_Edges = ['page']
    groupByS_Edges = ['section']
    groupByC_Edges = ['column']
    groupByR_Edges = ['row']
    groupBy_Edges = []
    if cmp(povitDimEdges,{'page':0,'section':0,'column':0,'row':0})==0:
##        measuresByPSCR_SQL = generateMeasuresByPSCR_SQL(povitEdgeCols,srcSql)
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':0,'column':0,'row':1})==0:
##        measuresByPSCR_SQL = generateMeasuresByPSCR_SQL(povitEdgeCols,srcSql)
##        measuresByPSC_SQL = generateMeasuresByPSC_SQL(povitEdgeCols,srcSql)
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':0,'column':1,'row':0})==0:
##        measuresByPSCR_SQL = generateMeasuresByPSCR_SQL(povitEdgeCols,srcSql)
##        measuresByPSR_SQL = generateMeasuresByPSR_SQL(povitEdgeCols,srcSql)
        measuresBy_SQLs = getMeasuresBy_SQLs(povitDimEdges,povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':1,'column':0,'row':0})==0:
        measuresByPSCR_SQL = generateMeasuresByPSCR_SQL(povitEdgeCols,srcSql)
        measuresByPCR_SQL = generateMeasuresByPCR_SQL(povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':0,'column':0,'row':0})==0:
        measuresByPSCR_SQL = generateMeasuresByPSCR_SQL(povitEdgeCols,srcSql)
        measuresBySCR_SQL = generateMeasuresBySCR_SQL(povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':0,'column':1,'row':1})==0:
        measuresByPSCR_SQL = generateMeasuresByPSCR_SQL(povitEdgeCols,srcSql)
        measuresByPSC_SQL = generateMeasuresByPSC_SQL(povitEdgeCols,srcSql)
        measuresByPSR_SQL = generateMeasuresByPSR_SQL(povitEdgeCols,srcSql)
        measuresByPS_SQL = generateMeasuresByPS_SQL(povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':1,'column':0,'row':1})==0:
        measuresByPSCR_SQL = generateMeasuresByPSCR_SQL(povitEdgeCols,srcSql)
        measuresByPSC_SQL = generateMeasuresByPSC_SQL(povitEdgeCols,srcSql)
        measuresByPCR_SQL = generateMeasuresByPCR_SQL(povitEdgeCols,srcSql)
        measuresByPC_SQL = generateMeasuresByPC_SQL(povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':1,'section':0,'column':0,'row':1})==0:
        measuresByPSCR_SQL = generateMeasuresByPSCR_SQL(povitEdgeCols,srcSql)
        measuresByPSC_SQL = generateMeasuresByPSC_SQL(povitEdgeCols,srcSql)
        measuresBySCR_SQL = generateMeasuresBySCR_SQL(povitEdgeCols,srcSql)
        measuresBySC_SQL = generateMeasuresBySC_SQL(povitEdgeCols,srcSql)
    elif cmp(povitDimEdges,{'page':0,'section':1,'column':1,'row':0})==0:
        measuresByPSCR_SQL = generateMeasuresByPSCR_SQL(povitEdgeCols,srcSql)
        measuresByPSR_SQL = generateMeasuresByPSR_SQL(povitEdgeCols,srcSql)
        measuresByPCR_SQL = generateMeasuresByPCR_SQL(povitEdgeCols,srcSql)
        measuresByPR_SQL = generateMeasuresByPR_SQL(povitEdgeCols,srcSql)
        
    elif cmp(povitDimEdges,{'page':1,'section':0,'column':1,'row':0})==0:
        measuresByPSCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSCR_Edges)
        measuresByPSR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSR_Edges)
        measuresBySCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySCR_Edges)
        measuresBySR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySR_Edges)
    elif cmp(povitDimEdges,{'page':1,'section':1,'column':0,'row':0})==0:
        measuresByPSCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSCR_Edges)
        measuresByPCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPCR_Edges)
        measuresBySCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySCR_Edges)
        measuresByCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByCR_Edges)
        
    elif cmp(povitDimEdges,{'page':0,'section':1,'column':1,'row':1})==0:
        measuresByPSCR_SQL = generateMeasuresByPSCR_SQL(povitEdgeCols,srcSql)
        measuresByPSC_SQL = generateMeasuresByPSC_SQL(povitEdgeCols,srcSql)
        measuresByPSR_SQL = generateMeasuresByPSR_SQL(povitEdgeCols,srcSql)
        measuresByPCR_SQL = generateMeasuresByPCR_SQL(povitEdgeCols,srcSql)
        measuresByPS_SQL = generateMeasuresByPS_SQL(povitEdgeCols,srcSql)
        measuresByPC_SQL = generateMeasuresByPC_SQL(povitEdgeCols,srcSql)
        measuresByPR_SQL = generateMeasuresByPR_SQL(povitEdgeCols,srcSql)
        measuresByP_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByP_Edges)
    elif cmp(povitDimEdges,{'page':1,'section':0,'column':1,'row':1})==0:
        measuresByPSCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSCR_Edges)
        measuresByPSC_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSC_Edges)
        measuresByPSR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSR_Edges)
        measuresBySCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySCR_Edges)
        measuresByPS_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPS_Edges)
        measuresBySC_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySC_Edges)
        measuresBySR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySR_Edges)
        measuresByS_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByS_Edges)
    elif cmp(povitDimEdges,{'page':1,'section':1,'column':0,'row':1})==0:
        measuresByPSCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSCR_Edges)
        measuresByPSC_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSC_Edges)
        measuresByPCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPCR_Edges)
        measuresBySCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySCR_Edges)
        measuresByPC_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPC_Edges)
        measuresBySC_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySC_Edges)
        measuresByCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByCR_Edges)
        measuresByC_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByC_Edges)
    elif cmp(povitDimEdges,{'page':1,'section':1,'column':1,'row':0})==0:
        measuresByPSCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSCR_Edges)
        measuresByPSR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSR_Edges)
        measuresByPCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPCR_Edges)
        measuresBySCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySCR_Edges)
        measuresByPR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPR_Edges)
        measuresBySR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySR_Edges)
        measuresByCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByCR_Edges)
        measuresByR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByR_Edges)
    elif cmp(povitDimEdges,{'page':1,'section':1,'column':1,'row':1})==0:
        measuresByPSCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSCR_Edges)
        measuresByPSC_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSC_Edges)
        measuresByPSR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPSR_Edges)
        measuresByPCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPCR_Edges)
        measuresBySCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySCR_Edges)
        measuresByPS_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPS_Edges)
        measuresByPC_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPC_Edges)
        measuresByPR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByPR_Edges)
        measuresBySC_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySC_Edges)
        measuresBySR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBySR_Edges)
        measuresByCR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByCR_Edges)
        measuresByP_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByP_Edges)
        measuresByS_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByS_Edges)
        measuresByC_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByC_Edges)
        measuresByR_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupByR_Edges)
        measuresByNone_SQL = generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBy_Edges)
    elif cmp(povitDimEdges,{'section':0,'column':0,'row':0})==0:
        edges = ['section','column','row']
        measuresBy_SQLs = []
        groupBy_EdgesRelevants = getRelevantGroupBy_Edges(edges,povitDimEdges)
        for groupBy_EdgesRelevant in groupBy_EdgesRelevants:
            measuresBy_SQLs = measuresBy_SQLs.append(generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBy_EdgesRelevant))
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
    
        
        
        
        
        

def generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBy_Edges):
    measuresBy_SQL = "JOIN (\r\nSELECT\r\n"
    measuresBy_groupby = ''
    for key in povitEdgeCols:
        if key in groupBy_Edges:
            measuresBy_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresBy_SQL)
            measuresBy_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresBy_groupby)
        elif key == 'mesure':
            measuresBy_SQL = getFactColsFromEdge(key,povitEdgeCols,measuresBy_SQL)
    measuresBy_SQL = concateMeasuresBy_SQL(measuresBy_SQL,srcSql,measuresBy_groupby,') ')
    return measuresBy_SQL

def getRelevantGroupBy_Edges(edges,povitDimEdges):
    groupBy_EdgesAll = []
    for selection in range(1, len(edges)):
        enum = comb(edges, selection)
        for i in enum:
            groupBy_EdgesAll.append(i)
    if 0 not in povitDimEdges.values():
        groupBy_EdgesAll.append([])
    groupBy_EdgesAll.append(edges)
    groupBy_EdgesRelevants = []
    for key in povitDimEdges:
        if povitDimEdges[key] == 0:
            for groupBy_EdgesOne in groupBy_EdgesAll:
                if key in groupBy_EdgesOne:
                    groupBy_EdgesRelevants.append(groupBy_EdgesOne)
    return groupBy_EdgesRelevants

def getMeasuresBy_SQLs(edges,povitDimEdges,povitEdgeCols,srcSql):
    measuresBy_SQLs = []
    edges = povitDimEdges.keys()
    groupBy_EdgesRelevants = getRelevantGroupBy_Edges(edges,povitDimEdges)
    for groupBy_EdgesRelevant in groupBy_EdgesRelevants:
        measuresBy_SQLs = measuresBy_SQLs.append(generateMeasuresBy_SQL(povitEdgeCols,srcSql,groupBy_EdgesRelevant))
    return measuresBy_SQLs

def generateMeasuresByPSCR_SQL(povitEdgeCols,srcSql):
    measuresByPSCR_SQL = "SELECT\r\n"
    measuresByPSCR_groupby = ''
    for key in povitEdgeCols:
        if key == 'page':
            measuresByPSCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPSCR_SQL)
            measuresByPSCR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPSCR_groupby)
        if key == 'section':
            measuresByPSCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPSCR_SQL)
            measuresByPSCR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPSCR_groupby)
        if key == 'column':
            measuresByPSCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPSCR_SQL)
            measuresByPSCR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPSCR_groupby)
        if key == 'row':
            measuresByPSCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPSCR_SQL)
            measuresByPSCR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPSCR_groupby)
        if key == 'measure':
            measuresByPSCR_SQL = getFactColsFromEdge(key,povitEdgeCols,measuresByPSCR_SQL)
    measuresByPSCR_SQL = concateMeasuresBy_SQL(measuresByPSCR_SQL,srcSql,measuresByPSCR_groupby)
##    measuresByPSCR_SQL = measuresByPSCR_SQL.rstrip(',\r\n')
##    measuresByPSCR_SQL = measuresByPSCR_SQL+'\r\n'
##    measuresByPSCR_SQL = measuresByPSCR_SQL+'FROM\r\n('+srcSql+') src \r\nGROUP BY\r\n'
##    measuresByPSCR_SQL = measuresByPSCR_SQL+measuresByPSCR_groupby
##    measuresByPSCR_SQL = measuresByPSCR_SQL.rstrip(',\r\n')
##    measuresByPSCR_SQL = measuresByPSCR_SQL+'\r\n'
    return measuresByPSCR_SQL

def generateMeasuresByPSC_SQL(povitEdgeCols,srcSql):
    measuresByPSC_SQL = "SELECT\r\n"
    for key in povitEdgeCols:
        if key == 'page':
            measuresByPSC_SQL=getDimColsFromEdge(key,povitEdgeCols,measuresByPSCR_SQL)
            measuresByPSC_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPSC_groupby)
        if key == 'section':
            measuresByPSC_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPSC_SQL)
            measuresByPSC_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPSC_groupby)
        if key == 'column':
            measuresByPSC_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPSC_SQL)
            measuresByPSC_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPSC_groupby)
        if key == 'row':
            measuresByPSC_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPSC_SQL)
        if key == 'measure':
            measuresByPSC_SQL = getFactColsFromEdge(key,povitEdgeCols,measuresByPSC_SQL)
    measuresByPSC_SQL = concateMeasuresBy_SQL(measuresByPSC_SQL,srcSql,measuresByPSC_groupby)
    return measuresByPSC_SQL

def generateMeasuresByPSR_SQL(povitEdgeCols,srcSql):
    measuresByPSR_SQL = "SELECT\r\n"
    measuresByPSR_groupby = ''
    for key in povitEdgeCols:
        if key == 'page':
            measuresByPSR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPSR_SQL)
            measuresByPSR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPSR_groupby)
        if key == 'section':
            measuresByPSR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPSR_SQL)
            measuresByPSR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPSR_groupby)
        if key == 'column':
            measuresByPSR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPSR_SQL)
        if key == 'row':
            measuresByPSR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPSR_SQL)
            measuresByPSR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPSR_groupby)
        if key == 'measure':
            measuresByPSR_SQL = getFactColsFromEdge(key,povitEdgeCols,measuresByPSR_SQL)
    measuresByPSR_SQL = concateMeasuresBy_SQL(measuresByPSR_SQL,srcSql,measuresByPSR_groupby)
    return measuresByPSR_SQL

def generateMeasuresByPCR_SQL(povitEdgeCols,srcSql):
    measuresByPCR_SQL = "SELECT\r\n"
    measuresByPCR_groupby = ''
    for key in povitEdgeCols:
        if key == 'page':
            measuresByPCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPCR_SQL)
            measuresByPCR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPCR_groupby)
        if key == 'section':
            measuresByPCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPCR_SQL)
        if key == 'column':
            measuresByPCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPCR_SQL)
            measuresByPCR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPCR_groupby)
        if key == 'row':
            measuresByPCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPCR_SQL)
            measuresByPCR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPCR_groupby)
        if key == 'measure':
            measuresByPCR_SQL = getFactColsFromEdge(key,povitEdgeCols,measuresByPCR_SQL)
    measuresByPCR_SQL = concateMeasuresBy_SQL(measuresByPCR_SQL,srcSql,measuresByPCR_groupby)
    return measuresByPCR_SQL

def generateMeasuresBySCR_SQL(povitEdgeCols,srcSql):
    measuresBySCR_SQL = "SELECT\r\n"
    measuresBySCR_groupby = ''
    for key in povitEdgeCols:
        if key == 'page':
            measuresBySCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresBySCR_SQL)
        if key == 'section':
            measuresBySCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresBySCR_SQL)
            measuresBySCR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresBySCR_groupby)
        if key == 'column':
            measuresBySCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresBySCR_SQL)
            measuresBySCR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresBySCR_groupby)
        if key == 'row':
            measuresBySCR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresBySCR_SQL)
            measuresBySCR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresBySCR_groupby)
        if key == 'measure':
            measuresByPSCR_SQL = getFactColsFromEdge(key,povitEdgeCols,measuresByPSCR_SQL)
    measuresByPSCR_SQL = concateMeasuresBy_SQL(measuresByPSCR_SQL,srcSql,measuresByPSCR_groupby)
    return measuresByPSCR_SQL

def generateMeasuresByPS_SQL(povitEdgeCols,srcSql):
    measuresByPS_SQL = "SELECT\r\n"
    measuresByPS_groupby = ''
    for key in povitEdgeCols:
        if key == 'page':
            measuresByPS_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPS_SQL)
            measuresByPS_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPS_groupby)
        if key == 'section':
            measuresByPS_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPS_SQL)
            measuresByPS_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPS_groupby)
        if key == 'column':
            measuresByPS_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPS_SQL)
        if key == 'row':
            measuresByPS_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPS_SQL)
        if key == 'measure':
            measuresByPS_SQL = getFactColsFromEdge(key,povitEdgeCols,measuresByPS_SQL)
    measuresByPS_SQL = concateMeasuresBy_SQL(measuresByPS_SQL,srcSql,measuresByPS_groupby)
    return measuresByPS_SQL

def generateMeasuresByPC_SQL(povitEdgeCols,srcSql):
    measuresByPC_SQL = "SELECT\r\n"
    measuresByPC_groupby = ''
    for key in povitEdgeCols:
        if key == 'page':
            measuresByPC_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPC_SQL)
            measuresByPC_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPC_groupby)
        if key == 'section':
            measuresByPC_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPC_SQL)
            measuresByPC_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPC_groupby)
        if key == 'column':
            measuresByPC_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPC_SQL)
            measuresByPC_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPC_groupby)
        if key == 'row':
            measuresByPC_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPC_SQL)
            measuresByPC_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPC_groupby)
        if key == 'measure':
            measuresByPC_SQL = getFactColsFromEdge(key,povitEdgeCols,measuresByPC_SQL)
    measuresByPC_SQL = concateMeasuresBy_SQL(measuresByPC_SQL,srcSql,measuresByPC_groupby)
    return measuresByPC_SQL

def generateMeasuresBySC_SQL(povitEdgeCols,srcSql):
    measuresBySC_SQL = "SELECT\r\n"
    measuresBySC_groupby = ''
    for key in povitEdgeCols:
        if key == 'page':
            measuresBySC_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresBySC_SQL)
        if key == 'section':
            measuresBySC_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresBySC_SQL)
            measuresBySC_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresBySC_groupby)
        if key == 'column':
            measuresBySC_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresBySC_SQL)
            measuresBySC_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresBySC_groupby)
        if key == 'row':
            measuresBySC_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresBySC_SQL)
        if key == 'measure':
            measuresBySC_SQL = getFactColsFromEdge(key,povitEdgeCols,measuresBySC_SQL)
    measuresBySC_SQL = concateMeasuresBy_SQL(measuresBySC_SQL,srcSql,measuresBySC_groupby)
    return measuresBySC_SQL

def generateMeasuresByPR_SQL(povitEdgeCols,srcSql):
    measuresByPR_SQL = "SELECT\r\n"
    measuresByPR_groupby = ''
    for key in povitEdgeCols:
        if key == 'page':
            measuresByPR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPR_SQL)
            measuresByPR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPR_groupby)
        if key == 'section':
            measuresByPR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPR_SQL)
        if key == 'column':
            measuresByPR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPR_SQL)
        if key == 'row':
            measuresByPR_SQL = getDimColsFromEdge(key,povitEdgeCols,measuresByPR_SQL)
            measuresByPR_groupby = getGroupbyColsFromEdge(key,povitEdgeCols,measuresByPR_groupby)
        if key == 'measure':
            measuresByPR_SQL = getFactColsFromEdge(key,povitEdgeCols,measuresByPR_SQL)
    measuresByPR_SQL = concateMeasuresBy_SQL(measuresByPR_SQL,srcSql,measuresByPR_groupby)
    return measuresByPR_SQL

def getDimColsFromEdge(key,povitEdgeCol,measuresBy_SQL):
    cols = povitEdgeCols[key]
    for col in cols:
        measuresBy_SQL = measuresBy_SQL+'src.'+col+' '+col+',\r\n'
    return measuresBy_SQL

def getGroupbyColsFromEdge(key,povitEdgeCols,measuresBy_groupby):
    cols = povitEdgeCols[key]
    for col in cols:
        measuresBy_groupby = measuresBy_groupby+'src.'+col+',\r\n'
    return measuresBy_groupby

def getFactColsFromEdge(key,povitEdgeCols,measuresBy_SQL):
    measureCols = povitEdgeCols[key]
    for key in measureCols:
        measuresBy_SQL = measuresBy_SQL+'src.'+key+' '+key+',\r\n'
    return measuresBy_SQL

def concateMeasuresBy_SQL(measuresBy_SQL,srcSql,measuresBy_groupby):
    measuresBy_SQL = measuresBy_SQL.rstrip(',\r\n')
    measuresBy_SQL = measuresBy_SQL+'\r\n'
    measuresBy_SQL = measuresBy_SQL+'FROM\r\n('+srcSql+') src \r\nGROUP BY\r\n'
    measuresBy_SQL = measuresBy_SQL+measuresBy_groupby
    measuresBy_SQL = measuresBy_SQL.rstrip(',\r\n')
    measuresBy_SQL = measuresBy_SQL+'\r\n'
    return measuresBy_SQL
    
