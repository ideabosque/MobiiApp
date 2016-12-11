import xml.dom.minidom as dom
from simbaStruct import *
import copy
import re

saw_NS = 'com.siebel.analytics.web/report/v1'
sawx_NS = 'com.siebel.analytics.web/expression/v1'
xsi_NS = 'http://www.w3.org/2001/XMLSchema-instance'
sawd_NS = 'com.siebel.analytics.web/dashboard/v1'

#Get the nodevalue from node
def getText(nodelist):
    rc = ""
    for node in nodelist:
        if node.nodeType == node.TEXT_NODE:
            rc = rc + node.data
    return rc

def getCid(subs,path):
    for key in subs:
        if key == path:
            return subs[key]

def getSavedFilter(path,savedFilters):
    for key in savedFilters:
        if  key == path:
            return savedFilters[key]
    

def setColref(colID,columns, obj):
    for col in columns.column:
        if col.columnId == colID:
            obj.column = col
    return obj

def formulaPartition(formulaString):
    formulaString=formulaString.replace('DISTINCT ','').replace(' IN ','+').replace(' FROM ','+').replace(' FOR ','+').replace('BOTH ','').replace('LEADING ','').replace('TRAILING ','').replace(' AS ','+').replace('CASE ','').replace(' WHEN ','+').replace(' THEN ','+').replace(' ELSE ','+').replace(' END','')
    formulaList=re.split('[+*/%()|,]+',formulaString)
    colsList = []
    for formula in formulaList:
        count=formula.count('.')
        if count==0:
            pass
        else:
            while(count>0):
                formula=formula.split('.',1)
                tabName=formula[0]
                colName=formula[1]
                    
                countTabMinus=tabName.count(' - ')
                if countTabMinus<=0:
                    tabNameList=tabName.split('-')
                    tabName=tabNameList[len(tabNameList)-1].replace('"','').replace("'",'')
                else:
                    tabNameFooter=tabName[tabName.find(' - '):]
                    tabNameFront=tabName[:tabName.find(' - ')]
                    if tabNameFront.count('-')>0:
                        tabNameFront=tabNameFront[tabNameFront.rfind('-')+1:]
                    tabName=(tabNameFront+tabNameFooter).replace('"','').replace("'",'')
                        
                countColMinus=colName.count(' - ')
                if countColMinus==0:
                    colNameList=colName.split('-',1)
                    if len(colNameList)>1:
                        formula=colNameList[1]
                        colName=colNameList[0].replace('"','').replace("'",'')
                    else:
                        colName=colNameList[0].replace('"','').replace("'",'')
                else:
                    if countColMinus==colName.count('-'):
                        colName=colName.replace('"','').replace("'",'')
                    else:
                        if (colName.find(' - ')+1)==colName.find('-'):
                            colNameFront=colName[:colName.find(' - ')+3]
                            colNameFooter=colName[colName.find(' - ')+3:]
                            colNameFooterList=colNameFooter.split('-',1)
                            colNameFooter=colNameFooterList[0]
                            formula=colNameFooterList[1]
                            colName=(colNameFront+colNameFooter).replace('"','').replace("'",'')
                        else:
                            colNameList=colName.split('-',1)
                            formula=colNameList[1]
                            colName=colNameList[0].replace('"','').replace("'",'')
                colDict = {'tabName':tabName,'colName':colName}
                colsList.append(colDict)
                count-=1
    return colsList

def getBaseView(views):
    compoundViews = {}
    for view in views:
        viewName = view.getAttribute('name')
        viewType = view.getAttributeNS(xsi_NS,'type')
        if viewType == 'saw:compoundView':
            compoundViewKey = filter(lambda x:x.isdigit(),viewName)
            compoundViewKey = int(compoundViewKey)
            compoundViews[compoundViewKey] = viewName
    if len(compoundViews) >0:
        key = min(compoundViews.keys())
    ##    return compoundViews[key]
        baseCompoundView = compoundViews[key]
        for view in views:
            viewName = view.getAttribute('name')
            viewType = view.getAttributeNS(xsi_NS,'type')
            if viewType == 'saw:viewSelector':
                viewSelectItems = view.getElementsByTagNameNS(saw_NS,'viewItem')
                for viewSelectItem in viewSelectItems:
                    if viewSelectItem.getAttribute('name') == baseCompoundView:
                        for view in views:
                            viewName_ = view.getAttribute('name')
                            viewType_ = view.getAttributeNS(xsi_NS,'type')
                            if viewType_ == 'saw:compoundView':
                                compoundViewCells = view.getElementsByTagNameNS(saw_NS,'cvCell')
                                for compoundViewCell in compoundViewCells:
                                    if compoundViewCell.getAttribute('viewName') == viewName:
                                        return viewName_
        return baseCompoundView
            
def getCviews(viewName,scrViews,viewSelection):
##    viewSelection = {}
    viewSelection[viewName] = {'type':'saw:compoundView','caption':''}
    for scrView in scrViews:
        if scrView.getAttribute('name') == viewName and scrView.getAttributeNS(xsi_NS,'type') == 'saw:compoundView':
            scrCvTabs = scrView.getElementsByTagNameNS(saw_NS,'cvTable')
            for scrCvTab in scrCvTabs:
                scrCvCells = scrCvTab.getElementsByTagNameNS(saw_NS,'cvCell')
                for scrCvCell in scrCvCells:
                    scrCvViewname = scrCvCell.getAttribute('viewName')
##                    #compoundView Contain compoundViews
##                    if scrCvViewname.find('compoundView') != -1:
##                        viewSelection = getCviews(scrCvViewname, scrViews, viewSelection)
                    if scrCvViewname.find('viewSelector') != -1:
                        for scrView in scrViews:
                            if scrView.getAttribute('name') == scrCvViewname:
                                scrCvViewType = scrView.getAttributeNS(xsi_NS,'type')
                                viewSelection[scrCvViewname] = {'type':scrCvViewType,'caption':''}
                                scrViewitems = scrView.getElementsByTagNameNS(saw_NS,'viewItem')
                                for scrViewitem in scrViewitems:
                                    scrViewitemName = scrViewitem.getAttribute('name')
                                    if scrViewitemName.find('compoundView') != -1:
                                        viewSelection = getCviews(scrViewitemName, scrViews, viewSelection)
                                    else:
                                        if len(scrViewitem.getElementsByTagNameNS(saw_NS,'text')) > 0 :
                                            scrViewitemCaption = scrViewitem.getElementsByTagNameNS(saw_NS,'text')[0].childNodes
                                        else:
                                            scrViewitemCaption = ''
                                        for scrView in scrViews:
                                            if scrViewitemName == scrView.getAttribute('name'):
                                                scrViewitemType = scrView.getAttributeNS(xsi_NS,'type')
                                        viewSelection[scrViewitemName] = {'type':scrViewitemType,'caption':getText(scrViewitemCaption)}
                    else:
                        for scrView in scrViews:
                            if scrCvViewname == scrView.getAttribute('name'):
                                scrCvViewType = scrView.getAttributeNS(xsi_NS,'type')
                        viewSelection[scrCvViewname] = {'type':scrCvViewType,'caption':''}
                        
    return viewSelection

def getCaption(viewCaption):
    captions = viewCaption.getElementsByTagNameNS(saw_NS,'caption')
    for caption in captions:
        captionTexts = caption.getElementsByTagNameNS(saw_NS,'text')
        for captionText in captionTexts:
            text = getText(captionText.childNodes)
    return text

class OBIEE10gConverter:
    def __init__(self,style=None,appName=None,subs=None,savedFilters=None,srcMetadata=None,app=None,columns=None):
        self.style = style
        self.appName = appName
        self.savedFilters = savedFilters
        self.subs = subs
        self.srcMetadata = srcMetadata
        self.app = app
        self.columns = columns
    def get_style(self):return self.style
    def set_style(self):self.style = style
    def get_appName(self):return self.Name
    def set_appName(self):self.appName = appName
    def get_subs(self):return self.subs
    def set_subs(self):self.subs = subs
    def get_savedFilters(self):return self.savedFilters
    def set_savedFilters(self):self.savedFilters = savedFilters
    def get_srcMetadata(self):return self.srcMetadata
    def set_srcMetadata(self):self.srcMetadata = srcMetaData
    def get_app(self):return self.app
    def set_app(self):self.app = app
    def get_columns(self):return self.columns
    def set_columns(self):self.columns = columns
    def generateApp(self):
        srcObj = dom.parseString(self.srcMetadata)
##        srcObj = dom.parse(self.srcMetadata)
        appObj = application()
        appObj.appName = self.appName
        if self.style == 'report':
            appObj.report = self.generateReport(srcObj)
        elif self.style == 'prompt':
            appObj.prompt = self.generatePrompt(srcObj)
        elif self.style == 'page':
            appObj.page = self.generateDashboardPage(srcObj)
        self.app = appObj
    def generateReport(self,srcObj):
        reportObj = report()
        srcCriteria = srcObj.getElementsByTagNameNS(saw_NS,'criteria')[0]
        reportObj.add_criteria(self.generateCriteria(srcCriteria))
        srcViews = srcObj.getElementsByTagNameNS(saw_NS,'views')[0]
        reportObj.views= self.generateViews(srcViews)
        return reportObj
    def generateCriteria(self,srcCriteria):
        criteriaObj = criteria()
        criteriaObj.schema = srcCriteria.getAttribute('subjectArea')
        srcColumns = srcCriteria.getElementsByTagNameNS(saw_NS,'columns')[0]
        criteriaObj.columns = self.generateColumns(srcColumns)
        self.columns = criteriaObj.columns
        if len(srcCriteria.getElementsByTagNameNS(saw_NS,'columnOrder')) > 0:
            srcColumnOrder = srcCriteria.getElementsByTagNameNS(saw_NS,'columnOrder')[0]
            criteriaObj.columnOrder = self.generateColumnOrder(srcColumnOrder)
        if len(srcCriteria.getElementsByTagNameNS(saw_NS,'filter')) > 0:
            srcFilter = srcCriteria.getElementsByTagNameNS(saw_NS,'filter')[0]
            criteriaObj.filter = self.generateFilter(srcFilter)
        return criteriaObj
    def generateColumns(self,srcColumns):
        columnsObj = columns()
        for srcColumn in srcColumns.childNodes:
            if srcColumn.nodeType == srcColumn.ELEMENT_NODE:
                columnsObj.add_column(self.generateColumn(srcColumn))
        return columnsObj
    def generateColumn(self,srcColumn):
        columnObj = column()
        columnObj.columnId = srcColumn.getAttribute('columnID')
        srcFormula = srcColumn.getAttribute('formula')#.replace("'","&apos;")
        columnObj.formula = srcFormula
        columnObj.aggRule = srcColumn.getAttribute('aggRule')
        for srcColumn_childNode in srcColumn.childNodes:
            if srcColumn_childNode.nodeType == srcColumn_childNode.ELEMENT_NODE and srcColumn_childNode.nodeName == 'saw:displayFormat':
                srcColInteraction = srcColumn_childNode.getAttribute('interaction')
                columnObj.interaction = srcColInteraction
                columnObj.suppress = srcColumn_childNode.getAttribute('suppress')
                if srcColumn_childNode.getAttribute('visibility') !='':
                    columnObj.visibility = srcColumn_childNode.getAttribute('visibility')
                if len(srcColumn_childNode.getElementsByTagNameNS(saw_NS,'navigation'))>0:
                    srcColNavs = srcColumn_childNode.getElementsByTagNameNS(saw_NS,'navTarget')
                    for srcColNav in srcColNavs:
                        colNavObj = nodeType()
                        navPath = srcColNav.getAttribute('path')
                        colNavObj.path = navPath
                        colNavObj.cid = getCid(self.subs,navPath)
                        columnObj.add_navigation(colNavObj)
                if len(srcColumn_childNode.getElementsByTagNameNS(saw_NS,'dataFormat')) > 0:
                    srcColFormat = srcColumn_childNode.getElementsByTagNameNS(saw_NS,'dataFormat')[0]
                    dataFormatObj = dataFormat()
                    dataFormatObj.type_ = srcColFormat.getAttributeNS(xsi_NS,'type')
                    dataFormatObj.commas = srcColFormat.getAttribute('commas')
                    dataFormatObj.negativeType = srcColFormat.getAttribute('negativeType')
                    dataFormatObj.minDigits = srcColFormat.getAttribute('minDigits')
                    dataFormatObj.maxDigits = srcColFormat.getAttribute('maxDigits')
                    columnObj.dataFormat = dataFormatObj
            elif srcColumn_childNode.nodeType == srcColumn_childNode.ELEMENT_NODE and srcColumn_childNode.nodeName == 'saw:columnHeading':
                colHeadingObj = columnHeadingType()
                if len(srcColumn_childNode.getElementsByTagNameNS(saw_NS,'displayFormat')) > 0:
                    colHeadingObj = columnHeadingType()
                    if len(srcColumn_childNode.getElementsByTagNameNS(saw_NS,'displayFormat')) > 0:
                        srcColHeadingInteraction = srcColumn_childNode.getElementsByTagNameNS(saw_NS,'displayFormat')[0].getAttribute('interaction')
                        colHeadingObj.interaction = srcColHeadingInteraction
                    if len(srcColumn_childNode.getElementsByTagNameNS(saw_NS,'caption')) > 0:
                        srcCaptionText = srcColumn_childNode.getElementsByTagNameNS(saw_NS,'text')[0]
                        colHeadingObj.captionText = getText(srcCaptionText.childNodes)
                    if len(srcColumn_childNode.getElementsByTagNameNS(saw_NS,'navigation'))>0:
                        srcColHeadingNavs = srcColumn_childNode.getElementsByTagNameNS(saw_NS,'navTarget')
                        for srcColHeadingNav in srcColHeadingNavs:
                            colHeadingNavObj = nodeType()
                            colHeadingNavObj.path = srcColHeadingNav.getAttribute('path')
                            colHeadingObj.add_navigation(colHeadingNavObj)
                    columnObj.columnHeading = colHeadingObj
        return columnObj
    def generateColumnOrder(self,srcColumnOrder):
        columnOrderObj = columnOrder()
        for srcColref in srcColumnOrder.childNodes:
            if srcColref.nodeType == srcColref.ELEMENT_NODE:
                columnRefObj = columnRef()
                columnRefObj.columnId = srcColref.getAttribute('columnID')
                columnRefObj.direction = srcColref.getAttribute('direction')
                columnOrderObj.add_columnRef(columnRefObj)
        return columnOrderObj
    def generateFilter(self,srcFilter):
        filterObj = filter()
        self.exprRecur(srcFilter,filterObj)
        return filterObj
    def exprRecur(self,node,lastObj):
        if len(node.childNodes)>0:
            for srcNode in node.childNodes:
                if srcNode.nodeType == srcNode.ELEMENT_NODE:
                    if srcNode.getAttributeNS(xsi_NS,'type') != 'saw:savedFilter':
                        expr_arg = expr()
                        expr_arg.exprType = srcNode.getAttributeNS(xsi_NS,'type')
                        expr_arg.op = srcNode.getAttribute('op')
                        text = getText(srcNode.childNodes).replace('\n','').replace('\t','')
                        if text != '' and text.find(' ') != 0:
                            expr_arg.exprValue = text.replace('"','&quot;').replace("'",'&apos;')
                        lastObj.add_expr(expr_arg)
                        self.exprRecur(srcNode,expr_arg)
                    elif srcNode.getAttributeNS(xsi_NS,'type') == 'saw:savedFilter':
                        srcSavedFilterPath = srcNode.getAttribute('path')
                        srcSavedFilterXml = getSavedFilter(srcSavedFilterPath,self.savedFilters)
                        srcSavedFilterObj = dom.parseString(srcSavedFilterXml)
                        srcSavedFilters = srcSavedFilterObj.getElementsByTagNameNS(saw_NS, 'filter')[0]
                        self.exprRecur(srcSavedFilters,lastObj)
    def generateViews(self,srcViews):
        viewsObj = views()
        for srcView in srcViews.childNodes:
            if srcView.nodeType == srcView.ELEMENT_NODE:
                if srcView.getAttributeNS(xsi_NS,'type') == 'saw:compoundView':
                    viewsObj.add_compoundView(self.generateCompoundView(srcView))
                elif srcView.getAttributeNS(xsi_NS,'type') == 'saw:viewSelector':
                    viewsObj.add_viewSelector(self.generateViewSelector(srcView))
                elif srcView.getAttributeNS(xsi_NS,'type') == 'saw:staticchart':
                    viewsObj.add_chart(self.generateChart(srcView,self.columns))
                elif srcView.getAttributeNS(xsi_NS,'type') == 'saw:pivotTableView':
                    viewsObj.add_pivotTable(self.generatePivotView(srcView,self.columns))
                elif srcView.getAttributeNS(xsi_NS,'type') == 'saw:columnSelectorView':
                    viewsObj.add_columnSelector(self.generateColSelectorView(srcView,self.columns))
                elif srcView.getAttributeNS(xsi_NS,'type') == 'saw:tableView':
                    viewsObj.add_tableView(self.generateTableView(srcView,self.columns))
        return viewsObj
    def generateCompoundView(self,srcView):
        compoundViewObj = compoundView()
        compoundViewObj.name = srcView.getAttribute('name')
        srcCompoundViewCells = srcView.getElementsByTagNameNS(saw_NS,'cvCell')
        for srcCompoundViewCell in srcCompoundViewCells:
            cellObj = cell()
            cellObj.viewName = srcCompoundViewCell.getAttribute('viewName')
            cellObj.viewType = srcCompoundViewCell.getAttributeNS(xsi_NS,'type')
            compoundViewObj.add_cell(cellObj)
        return compoundViewObj
    def generateViewSelector(self,srcView):
        viewSelectorObj = viewSelector()
        viewSelectorObj.name = srcView.getAttribute('name')
        if len(srcView.getElementsByTagNameNS(saw_NS,'viewSelectorCaption')) >0:
            srcViewSelectorCaption = srcView.getElementsByTagNameNS(saw_NS,'viewSelectorCaption')[0]
            if len(srcViewSelectorCaption.getElementsByTagNameNS(saw_NS,'caption'))>0:
                viewSelectorObj.caption = getCaption(srcViewSelectorCaption)
        srcViewItems = srcView.getElementsByTagNameNS(saw_NS,'viewItem')
        for srcViewItem in srcViewItems:
            viewItemObj = viewItem()
            viewItemObj.viewName = srcViewItem.getAttribute('name')
            if len(srcViewItem.getElementsByTagNameNS(saw_NS,'viewCaption'))>0:
                srcViewItemCaption = srcViewItem.getElementsByTagNameNS(saw_NS,'viewCaption')[0]
                viewItemObj.caption = getCaption(srcViewItemCaption)
            viewSelectorObj.add_viewItem(viewItemObj)
        return viewSelectorObj
    def generateChart(self, viewObj, columns):
        chartObj = chart()
        srcTemplateObj = viewObj.getElementsByTagNameNS(saw_NS,'template')[0]
        chartObj.name = viewObj.getAttribute('name')
        chartList = {'charts/area.cxml':'area','charts/bar.cxml':'bar','charts/column.cxml':'column','charts/line.cxml':'line','charts/linecolumn.cxml':'linecolumn','charts/pie.cxml':'pie','charts/radar.cxml':'radar','charts/scatter.cxml':'scatter','gauges/dial.gxml':'gauge','gauges/horizontalbar.gxml':'gauge','gauges/bulb.gxml':'gauge','charts/bubble.cxml':'bubble','charts/pareto.cxml':'pareto','charts/step.cxml':'step'}
        chartObj.chartType = chartList.get(srcTemplateObj.getAttribute('tid'),'none')
        if viewObj.getAttribute('chartPosition') != '':
            chartObj.chartPosition = viewObj.getAttribute('chartPosition')
        srcVariantSelectors=viewObj.getElementsByTagNameNS(saw_NS,'variantSelector')
        if len(srcVariantSelectors)>0:
            for srcVariantSelector in srcVariantSelectors:
                if srcVariantSelector.getAttribute('name') == 'subtype':
                    chartObj.subType = srcVariantSelector.getAttribute('value')
        if len(viewObj.getElementsByTagNameNS(saw_NS,'categories')) > 0:
            categories_arg = categories()
            srcCategories = viewObj.getElementsByTagNameNS(saw_NS,'category')
            for srcCategory in srcCategories:
                category_arg = category()
                category_arg.position = srcCategory.getAttribute('position')
                for srcCateChildnode in srcCategory.childNodes:
                    if srcCateChildnode.nodeType == srcCateChildnode.ELEMENT_NODE:
                        if srcCateChildnode.nodeName == 'saw:column':
                            for col in columns.column:
                                if col.columnId == srcCateChildnode.getAttribute('columnID'):
                                    category_arg.add_column(col)
                        elif srcCateChildnode.nodeName == 'saw:constant':
                            category_arg.value = srcCateChildnode.getAttribute('value')
                categories_arg.add_category(category_arg)
            chartObj.categories = categories_arg
        if len(viewObj.getElementsByTagNameNS(saw_NS,'interaction')) > 0:
            interact = interaction()
            srcInteractObj = viewObj.getElementsByTagNameNS(saw_NS,'interaction')[0]
            interact.interactiontType = srcInteractObj.getAttribute('type')
            if srcInteractObj.getAttribute('type') == 'navigate' and len(srcInteractObj.getElementsByTagNameNS(saw_NS,'navTargets'))>0:
                srcInteractNavTargetObjs = srcInteractObj.getElementsByTagNameNS(saw_NS,'navTarget')
                for srcInteractNavTargetObj in srcInteractNavTargetObjs:
                    interact_nav = nodeType()
                    srcInteractNavPath = srcInteractNavTargetObj.getAttribute('path')
                    interact_nav.path = srcInteractNavPath
                    interact_nav.cid = getCid(self.subs,srcInteractNavPath)
                    if srcInteractNavPath.find('\/') is not -1:
                        srcInteractNavPath = srcInteractNavPath.replace('\/','&&&')
                    navCatpions = srcInteractNavPath.split('/')
                    interact_nav.caption = navCatpions.pop().replace('&&&','/')
                    interact.add_navigation(interact_nav)
            chartObj.interaction = interact
        if len(viewObj.getElementsByTagNameNS(saw_NS,'measures')) > 0:
            measures_arg = measures()
            if len(viewObj.getElementsByTagNameNS(saw_NS,'measures')) > 0:
                srcMeas = viewObj.getElementsByTagNameNS(saw_NS,'measures')[0]
                for srcMeascol in srcMeas.childNodes:
                    if srcMeascol.nodeType == srcMeascol.ELEMENT_NODE:
                        for col in columns.column:
                            if col.columnId == srcMeascol.getAttribute('columnID'):
                                measureCol = copy.deepcopy(col)
                                measureCol.mesurePosition = srcMeascol.getAttribute('position')
                                measures_arg.add_column(measureCol)
    ##                            continue
            chartObj.measures = measures_arg
        if len(viewObj.getElementsByTagNameNS(saw_NS,'seriesGenerators')) > 0:
            seriesGenerators_arg = seriesGenerators()
            srcSeriesGenerator = viewObj.getElementsByTagNameNS(saw_NS,'seriesGenerators')[0]
            for srcSeriesGenerator_child in srcSeriesGenerator.childNodes:
                if srcSeriesGenerator_child.nodeType == srcSeriesGenerator_child.ELEMENT_NODE and srcSeriesGenerator_child.nodeName == 'saw:column':
                    for col in columns.column:
                        if col.columnId == srcSeriesGenerator_child.getAttribute('columnID'):
                            seriesGenerators_arg.add_column(col)
    ##                        continue
            chartObj.seriesGenerators = seriesGenerators_arg
        labels_arg = labels()
        axisF = axisFormat()
        axesFs = axesFormats()
        axisF.labels = labels_arg
        axesFs.add_axisFormat(axisF)
        chartObj.axesFormats = axesFs
        return chartObj
    def generatePivotView(self,srcView,columns):
        pivotTableObj = pivotTable()
        pivotName = srcView.getAttribute('name')
        pivotTableObj.name = pivotName
        srcPivotviews = srcView.getElementsByTagNameNS(saw_NS,'view')
        if len(srcPivotviews) > 0:
            for srcPivotview in srcPivotviews:
                if srcPivotview.getAttributeNS(xsi_NS, 'type') == 'saw:staticchart':
                    pivotchart = self.generateChart(srcPivotview,columns)
                    pivotchart.name = pivotName
                    pivotTableObj.chart = pivotchart
        srcEdges = srcView.getElementsByTagNameNS(saw_NS,'edge')
        if len(srcEdges) > 0:
            for srcEdge in srcEdges:
                edgeObj = edge()
                edgeObj.axis = srcEdge.getAttribute('axis')
                srcEdgetotal = srcEdge.getAttribute('total')
                seq = 0
                if srcEdgetotal != '' and srcEdgetotal != 'none':
                    edgeObj.total = srcEdgetotal
                if len(srcEdge.getElementsByTagNameNS(saw_NS,'totalLabel'))>0:
                    srcEdgeLayerTotalLabel = srcEdge.getElementsByTagNameNS(saw_NS,'totalLabel')[0]
                    if len(srcEdgeLayerTotalLabel.getElementsByTagNameNS(saw_NS,'caption'))>0:
                        srcEdgeLayerTotalLabelCaption = srcEdgeLayerTotalLabel.getElementsByTagNameNS(saw_NS,'caption')[0]
                        srcEdgeLayerTotalLabelCaptionText = srcEdgeLayerTotalLabelCaption.getElementsByTagNameNS(saw_NS,'text')[0]
                        edgeObj.totalLabel = getText(srcEdgeLayerTotalLabelCaptionText.childNodes)
                for edgeLayer in srcEdge.childNodes:
                    if edgeLayer.nodeType == edgeLayer.ELEMENT_NODE:
                        if edgeLayer.getAttribute('type') == 'labels':
                            measureLabelsObj = measureLabels()
                            srcLabelstotal = edgeLayer.getAttribute('total')
                            measureLabelsObj.edgeSeq = seq
                            seq += 1
                            if srcLabelstotal != '' and srcLabelstotal != 'none':
                                measureLabelsObj.total = srcLabelstotal
                            edgeObj.measureLabels = measureLabelsObj
                        if edgeLayer.getAttribute('type') == 'column':
                            colID = edgeLayer.getAttribute('columnID')
                            aggRule = edgeLayer.getAttribute('aggRule')
                            if len(edgeLayer.getElementsByTagNameNS(saw_NS,'displayFormat')) > 0:
                                edgeLayerVisibility = edgeLayer.getElementsByTagNameNS(saw_NS,'displayFormat')[0]
                                visibility = edgeLayerVisibility.getAttribute('visibility')
                            for colObj in columns.column:
                                if colObj.columnId == colID:
                                    povitCol = copy.deepcopy(colObj)
                                    if 'visibility' in dir():
                                        povitCol.visibility = visibility
                                        del visibility
                                    povitCol.edgeSeq = seq
                                    povitCol.aggRule =aggRule
                                    seq += 1
                                    for edgeLayerChild in edgeLayer.childNodes:
                                        if edgeLayerChild.nodeType == edgeLayerChild.ELEMENT_NODE and edgeLayerChild.nodeName == 'saw:columnHeading':
                                            for edgeLayerCaption in edgeLayerChild.childNodes:
                                                if edgeLayerCaption.nodeType == edgeLayerCaption.ELEMENT_NODE and edgeLayerCaption.nodeName == 'saw:caption':
                                                    edgeLayerCaptionText = edgeLayerCaption.getElementsByTagNameNS(saw_NS,'text')[0].childNodes
                                                    if povitCol.columnHeading:
                                                        povitCol.columnHeading.captionText = getText(edgeLayerCaptionText)
                                                    else:
                                                        povitColHeading = columnHeadingType()
                                                        povitColHeading.captionText = getText(edgeLayerCaptionText)
                                                        povitCol.columnHeading = povitColHeading
                                    edgeObj.add_column(povitCol)
                pivotTableObj.add_edge(edgeObj)
        return pivotTableObj
    def generateColSelectorView(self,srcView,columns):      
        colSelectorObj = columnSelector()
        colSelectorObj.name = srcView.getAttribute('name')
        srcColselectors = srcView.getElementsByTagNameNS(saw_NS,'selector')
        for srcColselector in srcColselectors:
            selectorObj = selector()
            if srcColselector.getAttribute('bPrompt') == 'true':
                selectorObj.columnId = srcColselector.getAttribute('columnID')
                if len(srcColselector.getElementsByTagNameNS(saw_NS,'choice'))>0:
                    srcColselChoices = srcColselector.getElementsByTagNameNS(saw_NS,'choice')
                    for srcColselChoice in srcColselChoices:
                        choiceObj = choice()
                        choiceObj.formula = srcColselChoice.getAttribute('formula')#.replace('"','&quot;')
                        for srcColselChoiceColFormat in srcColselChoice.childNodes:
                            if srcColselChoiceColFormat.nodeType == srcColselChoiceColFormat.ELEMENT_NODE and srcColselChoiceColFormat.nodeName == 'saw:displayFormat':
                                choiceObj.interaction = srcColselChoiceColFormat.getAttribute('interaction')
                                choiceObj.suppress = srcColselChoiceColFormat.getAttribute('suppress')
                                if len(srcColselChoiceColFormat.getElementsByTagNameNS(saw_NS,'navigation'))>0:
                                    srcColselChoiceColFormatNavs = srcColselChoiceColFormat.getElementsByTagNameNS(saw_NS,'navTarget')
                                    for srcColselChoiceColFormatNav in srcColselChoiceColFormatNavs:
                                        colNavObj = nodeType()
                                        colNavObj.path = srcColselChoiceColFormatNav.getAttribute('path')
                                        choiceObj.add_navigation(colNavObj)
                            elif srcColselChoiceColFormat.nodeType == srcColselChoiceColFormat.ELEMENT_NODE and srcColselChoiceColFormat.nodeName == 'saw:columnHeading':
                                colHeadingObj = columnHeadingType()
                                if len(srcColselChoiceColFormat.getElementsByTagNameNS(saw_NS,'displayFormat')) > 0:
                                    colHeadingObj.interaction = srcColselChoiceColFormat.getElementsByTagNameNS(saw_NS,'displayFormat')[0].getAttribute('interaction')
                                if len(srcColselChoiceColFormat.getElementsByTagNameNS(saw_NS,'navigation'))>0:
                                    srcColselChoiceColFormatColHeadingNavs = srcColselChoiceColFormat.getElementsByTagNameNS(saw_NS,'navTarget')
                                    for srcColselChoiceColFormatColHeadingNav in srcColselChoiceColFormatColHeadingNavs:
                                        colHeadingNavObj = nodeType()
                                        colHeadingNavObj.path = srcColselChoiceColFormatColHeadingNav.getAttribute('path')
                                        colHeadingObj.add_navigation(colHeadingNavObj)
                                if len(srcColselChoiceColFormat.getElementsByTagNameNS(saw_NS,'caption'))>0:
                                    colHeadingCaption = srcColselChoiceColFormat.getElementsByTagNameNS(saw_NS,'text')[0]
                                    colHeadingObj.captionText = getText(colHeadingCaption.childNodes)
                                choiceObj.columnHeading = colHeading
                        selectorObj.add_choice(choiceObj)
                
                if len(srcColselector.getElementsByTagNameNS(saw_NS,'label'))>0:
                    srcColselLabel = srcColselector.getElementsByTagNameNS(saw_NS,'label')[0]
                    srcColselLabelText = srcColselLabel.getElementsByTagNameNS(saw_NS,'text')[0]
                    selectorObj.caption = getText(srcColselLabelText.childNodes)
                colSelectorObj.add_selector(selectorObj)
        return colSelectorObj
    def generateTableView(self,srcView,columns):
        tableViewObj = tableView()
        tableViewObj.name = srcView.getAttribute('name')
        tableViewColRefs = srcView.getElementsByTagNameNS(saw_NS,'columnRef')
        for tableViewColRef in tableViewColRefs:
            tableViewObj.add_columnRef(self.generateTableViewColRef(tableViewColRef))
        return tableViewObj
    def generateTableViewColRef(self,tableViewColRef):
        columnRefObj = columnRef()
        columnRefObj.columnID = tableViewColRef.getAttribute('columnID')
        columnRefObj.total = tableViewColRef.getAttribute('total')
        return columnRefObj

    def generatePrompt(self,srcObj):
        if len(srcObj.getElementsByTagName('saw:prompt')) > 0:
            promptObj = prompt()
            srcPromptView = srcObj.getElementsByTagName('saw:view')[0]
            promptObj.scope = srcPromptView.getAttribute('scope')
            srcPrompts = srcObj.getElementsByTagName('saw:prompt')
            for srcPrompt in srcPrompts:
                promptObj.add_promptFilter(self.generatePromptFilter(srcPrompt))
            return promptObj
    def generatePromptFilter(self,srcPrompt):
        promptFilterObj = promptFilterType()
        promptFilterObj.type = srcPrompt.getAttribute('type')
        promptFilterObj.formula = srcPrompt.getAttribute('formula')#.replace('"','&quot;').replace("'",'&apos;')
        promptFilterObj.subjectArea = srcPrompt.getAttribute('subjectArea')
        promptFilterObj.op = srcPrompt.getAttribute('eOperator')
        promptFilterObj.control = srcPrompt.getAttribute('eControl')
        promptFilterObj.default = srcPrompt.getAttribute('eDefault')
        if promptFilterObj.default not in ['report','all']:
            srcPromptFilterDefaultValue = srcPrompt.getAttribute('default')
            promptFilterObj.defaultValue = srcPromptFilterDefaultValue#.replace('"','&quot;').replace("'",'&apos;')
        if promptFilterObj.op == 'between':
            if promptFilterObj.default not in ['report','all']:
                srcPromptFilterDefaultValue2 = srcPrompt.getAttribute('default2')
                promptFilterObj.defaultValue2 = srcPromptFilterDefaultValue2#.replace('"','&quot;')
        if srcPrompt.getAttribute('eValues') in ['','all']:
            promptFilterObj.values  = 'SELECT '+promptFilterObj.formula+' FROM '+promptFilterObj.subjectArea+' ORDER BY 1'
        elif srcPrompt.getAttribute('eValues') == 'sql':
            promptFilterObj.values = srcPrompt.getAttribute('sql')
        promptFilterObj.includeAllChoices = srcPrompt.getAttribute('includeAllChoices')
        promptFilterObj.constrainChoices = srcPrompt.getAttribute('constrainChoices')
        if promptFilterObj.op == 'in' and promptFilterObj.control != 'multi':
            promptFilterObj.setVariable = srcPrompt.getAttribute('eSetVariable')
            promptFilterObj.setVariableValue = srcPrompt.getAttribute('setVariable')
        for srcPrompt_child in srcPrompt.childNodes:
            if srcPrompt_child.nodeType == srcPrompt_child.ELEMENT_NODE and srcPrompt_child.nodeName == 'saw:label' and len(srcPrompt_child.getElementsByTagNameNS(saw_NS,'text')) >0:
                srcPromptFilterCaption = srcPrompt_child.getElementsByTagNameNS(saw_NS,'text')[0]
                promptFilterObj.caption = getText(srcPromptFilterCaption.childNodes)
        return promptFilterObj                

    def generateDashboardPage(self, srcObj):
        dhpageObj = page()
        srcDhpageColumns = srcObj.getElementsByTagNameNS(sawd_NS,'dashboardColumn')
        for srcDhpageColumn in srcDhpageColumns:
            srcDhpageSections = srcDhpageColumn.getElementsByTagNameNS(sawd_NS,'dashboardSection')
            for srcDhpageSection in srcDhpageSections:
                dhpageObj.add_section(self.generateDashboardSection(srcDhpageSection))
        return dhpageObj
    def generateDashboardSection(self, srcDhpageSection):
        dashboardSectionObj = section()
        dashboardSectionObj.name = srcDhpageSection.getAttribute('name')
        for srcDhpageSection_child in srcDhpageSection.childNodes:
            if srcDhpageSection_child.nodeType == srcDhpageSection_child.ELEMENT_NODE and srcDhpageSection_child.nodeName == 'sawd:globalFilterView':
                dashboardSectionObj.add_pagePrompt(self.generateDhpagePrompt(srcDhpageSection_child))
            elif srcDhpageSection_child.nodeType == srcDhpageSection_child.ELEMENT_NODE and srcDhpageSection_child.nodeName == 'sawd:reportView':
                dashboardSectionObj.add_pageReport(self.generateDhpageReport(srcDhpageSection_child))
            elif srcDhpageSection_child.nodeType == srcDhpageSection_child.ELEMENT_NODE and srcDhpageSection_child.nodeName == 'sawd:linkView':
                dashboardSectionObj.add_pageLink(self.generateDhpageLink(srcDhpageSection_child))
            elif srcDhpageSection_child.nodeType == srcDhpageSection_child.ELEMENT_NODE and srcDhpageSection_child.nodeName == 'sawd:navReport':
                dashboardSectionObj.pageNavReport == self.generateDhpageNavReport(srcDhpageSection_child)
            elif srcDhpageSection_child.nodeType == srcDhpageSection_child.ELEMENT_NODE and srcDhpageSection_child.nodeName == 'sawd:htmlView':
                dashboardSectionObj.add_pageHtml(self.generateDhpageHtml(srcDhpageSection_child))
        return dashboardSectionObj
    def generateDhpagePrompt(self,srcDhpageSection_child):
        dhpagePromptObj = nodeType()
        srcDhpagePromptPath = srcDhpageSection_child.getAttribute('path')
##        dhpagePromptObj.path = srcDhpagePromptPath
        dhpagePromptObj.cid = getCid(self.subs,srcDhpagePromptPath)
        return dhpagePromptObj
    def generateDhpageReport(self,srcDhpageSection_child):
        dhpageReportObj = nodeType()
        srcReportRef = srcDhpageSection_child.getElementsByTagNameNS(sawd_NS,'reportRef')[0]
        srcRptRefpath = srcReportRef.getAttribute('path')
        srcRptViewCaption = srcDhpageSection_child.getElementsByTagNameNS(saw_NS,'caption')[0]
        srcRptViewCaptionText = srcRptViewCaption.getElementsByTagNameNS(saw_NS,'text')[0]
        srcRptViewCaptionText = getText(srcRptViewCaptionText.childNodes)
##        dhpageReportObj.path = srcRptRefpath
        dhpageReportObj.caption = srcRptViewCaptionText
        dhpageReportObj.display = srcDhpageSection_child.getAttribute('display')
        dhpageReportObj.cid = self.subs[srcRptRefpath]
        return dhpageReportObj
    def generateDhpageLink(self,srcDhpageSection_child):
        dhpageLinkObj = pageLink()
        dhpageLinkObj.name = srcDhpageSection_child.getAttribute('name')
        dhpageLinkObj.type_ = srcDhpageSection_child.getAttribute('type')
        srcLinkPath = srcDhpageSection_child.getAttribute('destination')
        dhpageLinkObj.destination = srcLinkPath
##        if srcDhpageSection_child.getAttribute('type') == 'report':
##            dhpageLinkObj.nodeId = getLinkNid(linkPath)
        if srcDhpageSection_child.getAttribute('showEditorName') in ['false','']:
            for srcDhpageLink_child in srcDhpageSection_child.childNodes:
                if srcDhpageLink_child.nodeType == srcDhpageLink_child.ELEMENT_NODE:
                    if srcDhpageLink_child.nodeName == 'sawd:linkCaption':
                        if len(srcDhpageLink_child.getElementsByTagNameNS(saw_NS,'text'))>0:
                            srcDhpageLinkCaption = srcDhpageLink_child.getElementsByTagNameNS(saw_NS,'text')[0]
                            srcDhpageLinkCaptionText = getText(srcDhpageLinkCaption.childNodes)
                            dhpageLinkObj.caption = srcDhpageLinkCaptionText
                        elif srcDhpageLink_child.getAttribute('type') == 'report':
                            dhpageLinkObj.caption = srcLinkPath.split('/').pop()
                        elif srcDhpageLink_child.getAttribute('type') == 'url':
                            dhpageLinkObj.caption = srcLinkPath
        elif srcDhpageSection_child.getAttribute('type') == 'report':
            dhpageLinkObj.caption = srcLinkPath.split('/').pop()
        elif srcDhpageSection_child.getAttribute('type') == 'url':
            dhpageLinkObj.caption = srcLinkPath
        return dhpageLinkObj
    def generateDhpageNavReport(self,srcDhpageSection_child):
        dhpageNavReportObj = pageNavReport()
        dhpageNavReportObj.condition = srcDhpageSection_child.getAttribute('condition')
        srcNavReportRef = srcDhpageSection_child.getElementsByTagNameNS(sawd_NS,'reportRef')[0]
        dhpageNavReportObj.path = srcNavReportRef.getAttribute('path')
        return dhpageNavReportObj
    def generateDhpageHtml(self,srcDhpageSection_child):
        dhpageHtmlObj = pageHtml()
        srcHtmlView = srcDhpageSection_child.getElementsByTagNameNS(sawd_NS,'HTML')[0]
        srcHtmlViewText = getText(srcHtmlView.childNodes)
        dhpageHtmlObj = srcHtmlViewText
        return dhpageHtmlObj
