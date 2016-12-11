import simbaStruct
import json
import tempfile
import copy


class MetadataRenew:
    def __init__(self):
        pass

    def renewMetadata(self,renewInfo,srcMetadata):
        simbaObj = simbaStruct.parseString(srcMetadata)
##        simbaObj = simbaStruct.parse(srcMetadata)
        criteriaObjs = simbaObj.application.report.criteria
        viewsObj = simbaObj.application.report.views
        renewInfo = json.loads(renewInfo)
        renewColumns = renewInfo['columns']
        renewViews =  renewInfo['views']
        for criteriaObj in criteriaObjs:
            columnsObj = criteriaObj.columns
            columnObjs = columnsObj.column
            self.renewColumns(renewColumns,columnObjs,columnsObj)
        columnObjs = criteriaObjs[0].columns.column
        viewsObj = self.renewViews(renewViews,viewsObj,columnObjs)
        tfile = tempfile.TemporaryFile()
        simbaObj.export(tfile,0)
        tfile.seek(0)
        simbaxml = tfile.read()
        return simbaxml

    def renewColumns(self,renewColumns,columnObjs,columnsObj):
        renewColumnsCopy = copy.deepcopy(renewColumns)
        for columnID in renewColumns:
            for columnObj in columnObjs:
                if columnID == columnObj.columnId:
                    if renewColumns[columnID]['aggRule']:
                        columnObj.aggRule = renewColumns[columnID]['aggRule']
                    if 'columnHeading' in renewColumns[columnID]:
                        columnHeadingObj = simbaStruct.columnHeadingType()
                        columnHeadingObj.captionText = renewColumns[columnID]['columnHeading']
                        columnObj.columnHeading = columnHeadingObj
                    if 'drillThroughCid' in renewColumnsCopy[columnID]:
                        columnObj.interaction = 'navigate'
                        colNavObj = simbaStruct.nodeType()
                        colNavObj.cid = renewColumnsCopy[columnID]['drillThroughCid']
                        columnObj.add_navigation(colNavObj)
                    else:
                        columnObj.interaction = None 
                        del columnObj.navigation[:]
                    renewColumnsCopy.pop(columnID)
        for columnID in renewColumnsCopy:
            columnObj = simbaStruct.column()
            columnObj.columnId = columnID
            if renewColumnsCopy[columnID]['aggRule']:
                columnObj.aggRule = renewColumnsCopy[columnID]['aggRule']
            if 'columnHeading' in renewColumnsCopy[columnID]:
                columnHeadingObj = simbaStruct.columnHeadingType()
                columnHeadingObj.captionText = renewColumnsCopy[columnID]['columnHeading']
                columnObj.columnHeading = columnHeadingObj
            if 'drillThroughCid' in renewColumnsCopy[columnID]:
                columnObj.interaction = 'navigate'
                colNavObj = simbaStruct.nodeType()
                colNavObj.cid = renewColumnsCopy[columnID]['drillThroughCid']
                columnObj.add_navigation(colNavObj)
            else:
                columnObj.interaction = None 
                del columnObj.navigation[:]
            columnsObj.add_column(columnObj)
##        columnObjsCopy = copy.deepcopy(columnObjs)
        for columnObj in columnObjs:
            if columnObj.columnId not in renewColumns.keys():
                columnObjs.remove(columnObj)
        return columnObjs

    def renewViews(self,renewViews,viewsObj,columnObjs):
##        for renewView in renewViews:
##            if renewView['viewType'] == 'viewSelector' and renewView['action'] == 'add':
##                viewsObj = self.addViewSelector(renewView,viewsObj)
##            elif renewView['viewType'] == 'viewSelector' and renewView['action'] == 'edit':
##                viewsObj = self.editViewSelector(renewView,viewsObj)
        for renewView in renewViews:
            if renewView['action'] == 'add' and renewView['publish'] == 1:
                if renewView['viewType'] == 'chart':
                    viewsObj = self.addChart(renewView,viewsObj,columnObjs)
                elif renewView['viewType'] == 'pivotTable' and renewView['publish'] == 1:
                    viewsObj = self.addPivotTable(renewView,viewsObj,columnObjs)
                elif renewView['viewType'] == 'tableView' and renewView['publish'] == 1:
                    viewsObj = self.addTable(renewView,viewsObj,columnObjs)
                elif renewView['viewType'] == 'viewSelector' and renewView['publish'] == 1:
                    viewsObj = self.addViewSelector(renewView,viewsObj)
##                elif renewView['viewType'] == 'formView' and renewView['publish'] == 1:
##                    viewsObj = self.addForm(renewView,viewsObj)
                elif renewView['viewType'] == 'mapView' and renewView['publish'] == 1:
                    viewsObj = self.addMap(renewView,viewsObj,columnObjs)
            elif renewView['action'] == 'edit':
                if renewView['viewType'] == 'chart':
                    viewsObj = self.editChart(renewView,viewsObj,columnObjs)
                elif renewView['viewType'] == 'pivotTable':
                    viewsObj = self.editPivotTable(renewView,viewsObj,columnObjs)
                elif renewView['viewType'] == 'tableView':
                    viewsObj = self.editTable(renewView,viewsObj,columnObjs)
                elif renewView['viewType'] == 'viewSelector':
                    viewsObj = self.editViewSelector(renewView,viewsObj)
                elif renewView['viewType'] == 'compoundView' and renewView['publish'] == 1:
                    viewsObj = self.editCompound(renewView,viewsObj)
##                elif renewView['viewType'] == 'formView' and renewView['publish'] == 1:
##                    viewsObj = self.editForm(renewView,viewsObj)
                elif renewView['viewType'] == 'mapView' and renewView['publish'] == 1:
                    viewsObj = self.editMap(renewView,viewsObj,columnObjs)
        return viewsObj                   

    def addChart(self,renewView,viewsObj,columnObjs):
        chartObj = simbaStruct.chart()
        chartObj.name = renewView['viewName']
        chartObj.caption = renewView['viewCaption']
        chartObj.chartType = renewView['viewInfo']['type']
        if renewView['viewInfo']['categories']!=[]:
            renewViewCategoryCols = renewView['viewInfo']['categories']
            if renewView['viewInfo']['type'] == 'gaugeChart':
                gaugeTitlesObj = simbaStruct.gaugeTitles()
                for renewViewCategoryCol in renewViewCategoryCols:
                    for columnObj in columnObjs:
                        if columnObj.columnId == renewViewCategoryCol:
                            gaugeTitlesObj.add_column(columnObj)
                chartObj.gaugeTitles=gaugeTitlesObj
            else:
                categoriesObj = simbaStruct.categories()
                categoryObj = simbaStruct.category()
                for renewViewCategoryCol in renewViewCategoryCols:
                    for columnObj in columnObjs:
                        if columnObj.columnId == renewViewCategoryCol:
                            categoryObj.add_column(columnObj)
                            categoriesObj.add_category(categoryObj)
                chartObj.categories = categoriesObj
        if renewView['viewInfo']['series']!=[]:
            renewViewSeriesCols = renewView['viewInfo']['series']
            seriesGeneratorsObj = simbaStruct.seriesGenerators()
            for renewViewSeriesCol in renewViewSeriesCols:
                for columnObj in columnObjs:
                    if columnObj.columnId == renewViewSeriesCol:
                       seriesGeneratorsObj.add_column(columnObj)
            chartObj.seriesGenerators = seriesGeneratorsObj
        if renewView['viewInfo']['type'] == 'linecolumn':
            measurePositionLine = renewView['viewInfo']['measurePosition']['line']
            measurePositionColumn = renewView['viewInfo']['measurePosition']['column']
        if renewView['viewInfo']['measures']!=[]:
            renewViewMeasuresCols = renewView['viewInfo']['measures']
            if renewView['viewInfo']['type'] == 'gaugeChart':
                gaugePointersObj = simbaStruct.gaugePointers()
                for renewViewMeasuresCol in renewViewMeasuresCols:
                    pointerObj = simbaStruct.pointer()
                    for columnObj in columnObjs:
                        if columnObj.columnId == renewViewMeasuresCol:
                            pointerObj.column=columnObj
                gaugePointersObj.add_pointer(pointerObj)
                chartObj.gaugePointers = gaugePointersObj
            else:
                measuresObj = simbaStruct.measures()
                for renewViewMeasuresCol in renewViewMeasuresCols:
                    for columnObj in columnObjs:
                        if columnObj.columnId == renewViewMeasuresCol:
                            if renewView['viewInfo']['type'] == 'linecolumn':
                                if renewViewMeasuresCol in measurePositionLine:
                                    columnObjCopy = copy.deepcopy(columnObj)
                                    columnObjCopy.measurePosition = 1
                                elif renewViewMeasuresCol in measurePositionColumn:
                                    columnObjCopy = copy.deepcopy(columnObj)
                                    columnObjCopy.measurePosition = 0
                                measuresObj.add_column(columnObjCopy)
                            else:
                                measuresObj.add_column(columnObj)
                chartObj.measures = measuresObj
        if 'navigate' in renewView['viewInfo']:
            chartInteractionObj = simbaStruct.interaction()
            chartInteractionObj.interactiontType = 'navigate'
            chartInteractionNavObj = simbaStruct.nodeType()
            chartInteractionNavObj.cid = renewView['viewInfo']['navigate']['cid']
            chartInteractionNavObj.caption = renewView['viewInfo']['navigate']['caption']
            chartInteractionObj.add_navigation(chartInteractionNavObj)
            chartObj.interaction = chartInteractionObj
        if renewView['viewInfo']['type'] == 'gaugeChart':
            if renewView['viewInfo']['scale']:
                gaugeScaleObj = simbaStruct.gaugeScale()
                if renewView['viewInfo']['scale']['max']:
                    scaleMaxObj = simbaStruct.scaleMax()
##                    scaleMaxObj.type = 
                    scaleMaxObj.value = renewView['viewInfo']['scale']['max']
                    gaugeScaleObj.scaleMax = scaleMaxObj
                if renewView['viewInfo']['scale']['min']:
                    scaleMinObj = simbaStruct.scaleMin()
##                    scaleMinObj.type =
                    scaleMinObj.value = renewView['viewInfo']['scale']['min']
                    gaugeScaleObj.scaleMin = scaleMinObj
                chartObj.gaugeScale = gaugeScaleObj
        if 'subType' in renewView['viewInfo']:
            chartObj.subType = renewView['viewInfo']['subType']
        viewsObj.add_chart(chartObj)
##        if viewsObj.viewSelector == []:
##            self.insertViewToCompound(renewView,viewsObj)
        return viewsObj

    def addPivotTable(self,renewView,viewsObj,columnObjs):
        pivotTableObj = simbaStruct.pivotTable()
        pivotTableObj.name = renewView['viewName']
        pivotTableObj.caption = renewView['viewCaption']
        edgePageObj = simbaStruct.edge()
        edgePageObj.axis = 'page'
        if renewView['viewInfo']['page']['columns']!=[]:
            renewViewpivotTablePageCols = renewView['viewInfo']['page']['columns']
            if 'total' in renewView['viewInfo']['page']:
                edgePageObj.total = renewView['viewInfo']['page']['total']
            for renewViewpivotTablePageCol in renewViewpivotTablePageCols:
                for columnObj in columnObjs:
                    if columnObj.columnId == renewViewpivotTablePageCol:
                        edgePageObj.add_column(columnObj)
        pivotTableObj.add_edge(edgePageObj)
        edgeSectionObj = simbaStruct.edge()
        edgeSectionObj.axis = 'section'
        if renewView['viewInfo']['section']['columns']!=[]:
            renewViewpivotTableSectionCols = renewView['viewInfo']['section']['columns']
            if 'total' in renewView['viewInfo']['section']:
                edgeSectionObj.total = renewView['viewInfo']['section']['total']
            for renewViewpivotTableSectionCol in renewViewpivotTableSectionCols:
                for columnObj in columnObjs:
                    if columnObj.columnId == renewViewpivotTableSectionCol:
                        edgeSectionObj.add_column(columnObj)
        pivotTableObj.add_edge(edgeSectionObj)
        edgeColumnObj = simbaStruct.edge()
        edgeColumnObj.axis = 'column'
        if renewView['viewInfo']['column']['columns']!=[]:
            renewViewpivotTableColumnCols = renewView['viewInfo']['column']['columns']
            if 'total' in renewView['viewInfo']['column']:
                edgeColumnObj.total = renewView['viewInfo']['column']['total']
            for renewViewpivotTableColumnCol in renewViewpivotTableColumnCols:
                for columnObj in columnObjs:
                    if columnObj.columnId == renewViewpivotTableColumnCol:
                        edgeColumnObj.add_column(columnObj)
        pivotTableObj.add_edge(edgeColumnObj)
        edgeRowObj = simbaStruct.edge()
        edgeRowObj.axis = 'row'
        if renewView['viewInfo']['row']['columns']!=[]:
            renewViewpivotTableRowCols = renewView['viewInfo']['row']['columns']
            if 'total' in renewView['viewInfo']['row']:
                edgeRowObj.total = renewView['viewInfo']['row']['total']
            for renewViewpivotTableRowCol in renewViewpivotTableRowCols:
                for columnObj in columnObjs:
                    if columnObj.columnId == renewViewpivotTableRowCol:
                        edgeRowObj.add_column(columnObj)
        pivotTableObj.add_edge(edgeRowObj)
        if renewView['viewInfo']['measure']!=[]:
            renewViewpivotTableMeasureCols = renewView['viewInfo']['measure']
            edgeObj = simbaStruct.edge()
            edgeObj.axis = 'measure'
            for renewViewpivotTableMeasureCol in renewViewpivotTableMeasureCols:
                for columnObj in columnObjs:
                    if columnObj.columnId == renewViewpivotTableMeasureCol:
                        edgeObj.add_column(columnObj)
            pivotTableObj.add_edge(edgeObj)
        measureLabel = renewView['viewInfo']['measureLabel']
        pivotTableEdgeObjs = pivotTableObj.edge
        for pivotTableEdgeObj in pivotTableEdgeObjs:
            if pivotTableEdgeObj.axis == measureLabel:
                measureLabelsObj = simbaStruct.measureLabels()
                measureLabelsObj.edgeSeq = 0
                pivotTableEdgeObj.measureLabels = measureLabelsObj
        viewsObj.add_pivotTable(pivotTableObj)
##        if viewsObj.viewSelector == []:
##            self.insertViewToCompound(renewView,viewsObj)
        return viewsObj

    def addTable(self,renewView,viewsObj,columnObjs):
        tableObj = simbaStruct.tableView()
        tableObj.name = renewView['viewName']
        tableObj.caption = renewView['viewCaption']
        viewsObj.add_tableView(tableObj)
##        if viewsObj.viewSelector == []:
##            self.insertViewToCompound(renewView,viewsObj)
        return viewsObj

##    def addForm(self,renewView,viewsObj,columnObjs):
##        formObj = simbaStruct.formView()
##        formObj.name = renewView['viewName']
##        formObj.caption = renewView['viewCaption']
##        viewsObj.add_formView(formObj)
##        return viewsObj

    def addMap(self,renewView,viewsObj,columnObjs):
        mapObj = simbaStruct.mapView()
        mapObj.name = renewView['viewName']
        mapObj.caption = renewView['viewCaption']
        mapObj.geocodeSource = renewView['viewInfo']['geocodeSource']
        if renewView['viewInfo']['centerLatitude']:
            mapObj.centerLatitude = renewView['viewInfo']['centerLatitude']
        if renewView['viewInfo']['centerLongitude']:
            mapObj.centerLongitude = renewView['viewInfo']['centerLongitude']
        if renewView['viewInfo']['latitude'] and renewView['viewInfo']['geocodeSource']=='coordinate':
            latitudeObj = simbaStruct.latitude()
            for columnObj in columnObjs:
                if columnObj.columnId == renewView['viewInfo']['latitude']:
                    latitudeObj.column = columnObj
            mapObj.latitude = latitudeObj
        if renewView['viewInfo']['longitude'] and renewView['viewInfo']['geocodeSource']=='coordinate':
            longitudeObj = simbaStruct.longitude()
            for columnObj in columnObjs:
                if columnObj.columnId == renewView['viewInfo']['longitude']:
                    longitudeObj.column = columnObj
            mapObj.longitude = longitudeObj
        if renewView['viewInfo']['location'] and renewView['viewInfo']['geocodeSource']=='address':
            locationObj = simbaStruct.location()
            for columnObj in columnObjs:
                if columnObj.columnId == renewView['viewInfo']['location']:
                    locationObj.column = columnObj
            mapObj.location = locationObj
        if renewView['viewInfo']['series']:
            seriesGeneratorsObj = simbaStruct.seriesGenerators()
            seriesCols = renewView['viewInfo']['series']
            for seriesCol in seriesCols:
                for columnObj in columnObjs:
                    if columnObj.columnId == seriesCol:
                        seriesGeneratorsObj.add_column(columnObj)
            mapObj.seriesGenerators = seriesGeneratorsObj
        viewsObj.add_mapView(mapObj)
        return viewsObj

    def addViewSelector(self,renewView,viewsObj):
        viewSelectorObj = simbaStruct.viewSelector()
        viewSelectorObj.name = renewView['viewName']
        viewSelectorObj.caption = renewView['viewCaption']
        for view in renewView['viewInfo']:
            viewItemObj = simbaStruct.viewItem()
            viewItemObj.viewName = view['viewName']
            viewItemObj.caption = view['caption']
            viewItemObj.viewType = view['viewType']
            viewSelectorObj.add_viewItem(viewItemObj)
        viewsObj.add_viewSelector(viewSelectorObj)
##        compoundViewObjs = viewsObj.compoundView
##        for compoundViewObj in compoundViewObjs:
##            del compoundViewObj.cell[:]
##        self.insertViewToCompound(renewView,viewsObj)
        return viewsObj

    def editViewSelector(self,renewView,viewsObj):
        viewSelectorObjs = viewsObj.viewSelector
        for viewSelectorObj in viewSelectorObjs:
            if renewView['viewName'] == viewSelectorObj.name:
                viewSelectorObjs.remove(viewSelectorObj)
##                self.removeViewFromCompound(renewView,viewsObj)
                if renewView['publish'] == 1:
                    self.addViewSelector(renewView,viewsObj)
##                elif renewView['publish'] == 0:
##                    viewItemObjs = viewSelectorObj.viewItem
##                    for viewItemObj in viewItemObjs:
##                        viewItemInfo = {}
##                        viewItemInfo['viewName']=viewItemObj.viewName
##                        viewItemInfo['viewType']=viewItemObj.viewType
##                        self.insertViewToCompound(viewItemInfo,viewsObj)
        return viewsObj

    def editChart(self,renewView,viewsObj,columnObjs):
        chartObjs = viewsObj.chart
        for chartObj in chartObjs:
            if renewView['viewName'] == chartObj.name:
                chartObjs.remove(chartObj)
##                self.removeViewFromCompound(renewView,viewsObj)
                if renewView['publish'] == 1:
                    self.addChart(renewView,viewsObj,columnObjs)
        return viewsObj

    def editPivotTable(self,renewView,viewsObj,columnObjs):
        pivotTableObjs = viewsObj.pivotTable
        for pivotTableObj in pivotTableObjs:
            if renewView['viewName'] == pivotTableObj.name:
                pivotTableObjs.remove(pivotTableObj)
##                self.removeViewFromCompound(renewView,viewsObj)
                if renewView['publish'] == 1:
                    self.addPivotTable(renewView,viewsObj,columnObjs)
        return viewsObj

    def editTable(self,renewView,viewsObj,columnObjs):
        tableObjs = viewsObj.tableView
        for tableObj in tableObjs:
            if renewView['viewName'] == tableObj.name:
                tableObjs.remove(tableObj)
##                self.removeViewFromCompound(renewView,viewsObj)
                if renewView['publish'] == 1:
                    self.addTable(renewView,viewsObj,columnObjs)
        return viewsObj

    def editMap(self,renewView,viewsObj,columnObjs):
        mapObjs = viewsObj.mapView
        for mapObj in mapObjs:
            if renewView['viewName'] == mapObj.name:
                mapObjs.remove(mapObj)
                if renewView['publish'] == 1:
                    self.addMap(renewView,viewsObj,columnObjs)
        return viewsObj

##    def editForm(self,renewView,viewsObj,columnObjs):
##        formObjs = viewsObj.formView
##        for formObj in formObjs:
##            if renewView['viewName'] == formObj.name:
##                formObjs.remove(formObj)
##                if renewView['publish'] == 1:
##                    self.addForm(renewView,viewsObj,columnObjs)
##        return viewsObj

    def editCompound(self,renewView,viewsObj):
        compoundObjs = viewsObj.compoundView
        for compoundObj in compoundObjs:
            if renewView['viewName'] == compoundObj.name:
                del compoundObj.cell[:]
                for cell in renewView['viewInfo']:
                    cellObj = simbaStruct.cell()
                    cellObj.viewType = cell['viewType']
                    cellObj.viewName = cell['viewName']
                    compoundObj.add_cell(cellObj)
        return viewsObj
    
    def insertViewToCompound(self,renewView,viewsObj):
        compoundViewObjs = viewsObj.compoundView
        for compoundViewObj in compoundViewObjs:
            cellObj = simbaStruct.cell()
            cellObj.viewType = renewView['viewType']
            cellObj.viewName = renewView['viewName']
            compoundViewObj.add_cell(cellObj)
        return viewsObj

    def removeViewFromCompound(self,renewView,viewsObj):
        compoundViewObjs = viewsObj.compoundView
        for compoundViewObj in compoundViewObjs:
            cellObjs = compoundViewObj.cell
            for cellObj in cellObjs:
                if renewView['viewName'] == cellObj.viewName and renewView['viewType'] == cellObj.viewType:
                    cellObjs.remove(cellObj)
        return viewsObj
