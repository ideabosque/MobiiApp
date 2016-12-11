#Version: 2(for 11g) ,Modified Date: 2011-06-15,  By: Ariel   


from metadata import *
import xml.dom.minidom as dom

treeIndex = dom.parse('TreeIndex.xml')        #need change by the specific path
subjectAreas = treeIndex.getElementsByTagName('RefSubjectArea')

subject_area = raw_input('subjectArea is :')

metadata = metadata()
subjectArea_ = subjectArea()
subjectArea_.name = subject_area
metadata.add_subjectArea(subjectArea_)
#print subjectAreas
def getSubjectTables(subject_area):
    for i in range(len(subjectAreas)):
        if subject_area == subjectAreas[i].getAttribute('name'):
            tables_Link = subjectAreas[i].getAttribute('xlink:href').replace('./','')
           # print subject_area
            tables_XML = dom.parse(tables_Link)
            tables = tables_XML.getElementsByTagName('RefPresentationTable')
    return tables

#print getSubjectTables(subject_area)
tables = getSubjectTables(subject_area)
columns_ = columns()
levelmaps =[]
all_columns = []

for j in range(len(tables)):
    tableName = tables[j].getAttribute('name')
    columns_link = tables[j].getAttribute('xlink:href').replace('../','')
    columns_XML = dom.parse(columns_link)
    columns_tag = columns_XML.getElementsByTagName('RefLogicalColumn')
    present_col = columns_XML.getElementsByTagName('RefPresentationColumn')
    for k in range(len(columns_tag)):                                      
        logicalCol_link = columns_tag[k].getAttribute('xlink:href').replace('../../','')
        logicalCol_XML = dom.parse(logicalCol_link)
        levelMaps = logicalCol_XML.getElementsByTagName('LevelAssociations')   #it is for the following condition : if len(levelMaps) > 0:
        mapSourceTables = logicalCol_XML.getElementsByTagName('Mappings')      #it is for the following condition : if len(levelMaps) == 0:
        
        column_name = present_col[k].getAttribute('name')
        logical_column = columns_tag[k].getAttribute('name')           ## for drillkey's judgement later

        column_ = column()                                            ## instance object column_
        column_.columnName = column_name                              #get column.presentation columnName
        column_.tableName = tableName                                 #get column.tableName
        column_.logicalColumn = logical_column                        #get column.logicalColumn
        column_.nullable = ''
        column_.dataType = ''
        column_.aggrRule = ''
        column_.aggregateable = ''

        businessMod = logicalCol_XML.getElementsByTagName('RefBusinessModel') ##get levelMapping.businessMod
        logicalTable = logicalCol_XML.getElementsByTagName('RefLogicalTable')
        logicalTable_name = logicalTable[0].getAttribute('name')
        logicalColumn_ = logicalCol_XML.getElementsByTagName('LogicalColumn')
        
        if 'Fact' in logicalTable_name:
            column_.type_ = 'Fact'
        if 'Dim' in logicalTable_name:                #get column.type   
            column_.type_ = 'Dim'
        elif  'Dim' not in logicalTable_name and 'Fact' not in logicalTable_name:
            column_.type_ = 'Other'
        if 'Fact' not in logicalTable_name:

            if len(levelMaps) > 0:                                          

                levelMap = levelMaps[0].getElementsByTagName('LevelAssociation')
                for level_ in levelMap:                                            
                                                         
                    level_mapping = levelMapping()                                # instance object level_mapping
                    dim_level = dimLevel()                                         #instance object dim_level
                    logicLevel = level_.getElementsByTagName('RefLogicalLevel')
                    level_dimension = level_.getElementsByTagName('RefDimension')
                    level_mapping.level = logicLevel[0].getAttribute('name')
                    dim_level.level = level_mapping.level
                    level_mapping.dimension = level_dimension[0].getAttribute('name')
                    dim_level.dimension = level_mapping.dimension
                    level_mapping.businessModel = businessMod[0].getAttribute('name')
                    dim_level.businessModel = level_mapping.businessModel
                 
                    column_.add_dimLevel(dim_level)                #get column.dimLevel

                    level_link = logicLevel[0].getAttribute('xlink:href').replace('../../../','')
                    level_XML = dom.parse(level_link)
                    levelKeys = level_XML.getElementsByTagName('LevelKeys')
                    if len(levelKeys) > 0:
                        level_key = levelKeys[0].getElementsByTagName('RefLogicalKey')
                    
                        for levelkey in level_key:                                     #get column.level.levelKey 
                            level_key_name = levelkey.getAttribute('name')
                            if level_key_name == 'Row Wid':
                                break
                            else:
                                levelKey_link = levelkey.getAttribute('xlink:href').replace('../../../','')
                                levelKey_XML = dom.parse(levelKey_link)
                                levelKeys_ = levelKey_XML.getElementsByTagName('LogicalColumns')
                                levelKey_ = levelKeys_[0].getElementsByTagName('RefLogicalColumn')  
                                for level_column in levelKey_:
                                    levelkey_column = level_column.getAttribute('name')
                                    level_key = levelKey()
                                    level_key.columnName = levelkey_column
                                    level_key.tableName = column_.tableName
                                    
                                    level_mapping.add_levelKey(level_key)
                                
                    levelmaps.append(level_mapping)                # get levelMappings' list
            
                               
            if len(mapSourceTables) > 0 and len(levelMaps) == 0:                                #get columns' level without levelMapping by table Source 
               

                mapSourceTable = mapSourceTables[0].getElementsByTagName('Mapping')
                for sourceTable in mapSourceTable:
                    tableSrc_level = levelMapping()
                    
                    tableSource = sourceTable.getElementsByTagName('RefLogicalTableSource')
                    tableSrc_link = tableSource[0].getAttribute('xlink:href').replace('../../../','')
                    tableSrc_XML = dom.parse(tableSrc_link)
                    groupBy = tableSrc_XML.getElementsByTagName('GroupBy')
                    if len(groupBy)> 0:
                        groupByLevelTag = groupBy[0].getElementsByTagName('RefLogicalLevel')
                        groupByLevel = groupByLevelTag[0].getAttribute('name').split('.')

                        groupByLevel_link = groupByLevelTag[0].getAttribute('xlink:href').replace('../../../','')
                        groupByLevel_XML = dom.parse(groupByLevel_link)
                        tableS_levelKeys = groupByLevel_XML.getElementsByTagName('LevelKeys')
                        if len(tableS_levelKeys) > 0:
                            tableS_levelKey = tableS_levelKeys[0].getElementsByTagName('RefLogicalKey')
                            
                            tableSrc_level.level = groupByLevel[1]          #get instance tableSrc_level.level           
                            tableSrc_level.dimension = groupByLevel[0]       #get instance tableSrc_level.dimension 
                            tableSrc_level.businessModel = businessMod[0].getAttribute('name')  #get instance tableSrc_level's businessModel  

                            for tableS_level_key in  tableS_levelKey:
                                tableS_key_name = tableS_level_key.getAttribute('name')
                                if tableS_key_name == 'Row Wid':
                                    break
                                else:
                                    tableS_levelKey_link = tableS_level_key.getAttribute('xlink:href').replace('../../../','')
                                    tableS_levelKey_XML = dom.parse(tableS_levelKey_link)
                                    tableS_levelKey_ = tableS_levelKey_XML.getElementsByTagName('RefLogicalColumn')
                                    for tableS_level_column in tableS_levelKey_:
                                        tableS_levelkey_name = tableS_level_column.getAttribute('name')
                                        level_key_ = levelKey()
                                        level_key_.columnName = tableS_levelkey_name
                                        level_key_.tableName = column_.tableName
                                        tableSrc_level.add_levelKey(level_key_)
                            
                        levelmaps.append(tableSrc_level)
                        dim_level = dimLevel()
                        
                        dim_level.dimension = tableSrc_level.dimension
                        dim_level.businessModel = tableSrc_level.businessModel
                        
                        if 'Detail' in groupByLevel[1] and len(mapSourceTable) > 1:
                            pass                               
                        else:
                            dim_level.level = tableSrc_level.level
                            column_.add_dimLevel(dim_level)                    # get column.dimLevel
                       

        
               # if len(column_.dimLevel) > 1:
                 #   for num in range(len(column_.dimLevel)):
                    #    for num_ in range(num):
                      #      if column_.dimLevel(num_).level == column_.dimLevel(num).level:
                        #        column_.remove(dimLevel(num_)
                
                
                         
        all_columns.append(column_)
               

subjectArea_.columns = columns_

levelmaps_filter = []
if len(levelmaps) > 0:
    levelmaps_filter.append(levelmaps[0])
for i in range(1,len(levelmaps)):     
    for j in range(i):
        if levelmaps[i].businessModel == levelmaps[j].businessModel and levelmaps[i].dimension == levelmaps[j].dimension and levelmaps[i].level == levelmaps[j].level:
            if len(levelmaps[i].levelKey) <=len(levelmaps[j].levelKey):
                break
            elif j == i-1:
                if len(levelmaps[i].levelKey) > len(levelmaps[j].levelKey):
                    levelmaps_filter.append(levelmaps[i])
                    levelmaps_filter.remove(levelmaps[j])       #remove the same levelMap which has less levelKey   
                
        elif j == i-1:     
            levelmaps_filter.append(levelmaps[i])
            
for level_map in levelmaps_filter:
    child_level = raw_input('level_mapping.dimension and level are:  ' + level_map.dimension +'  and   '+ level_map.level+','+ ' childLevel is:')
    level_map.childLevel = child_level
    for level_key in level_map.levelKey:
        drill_key = raw_input('levelkey_column is :'+ level_key.columnName +','+ 'its DrillKey is: ') 
        if drill_key == 'yes':
            level_key.drillKey = drill_key
            
    subjectArea_.add_levelMapping(level_map)
    

for m in range(len(all_columns)):
    if  len(all_columns[m].dimLevel) > 0:
        for n in range(len(levelmaps_filter)):
            if all_columns[m].dimLevel[0].dimension == levelmaps_filter[n].dimension :

            
                if all_columns[m].dimLevel[0].level == levelmaps_filter[n].level :        # get all column's drillColumn(weight=0)
                      
                    for l in range(len(levelmaps_filter[n].levelKey)):
                        count = 0
                        if levelmaps_filter[n].levelKey[l].drillKey == 'yes':
                            count = count + 1
                            
                            if levelmaps_filter[n].levelKey[l].columnName == all_columns[m].logicalColumn: # in this cycle not only remove the drillColumn which itself is drill key
                                for t in range(len(all_columns)):                                # but also get drill column whose child level is not in levelMapping
                                    for p in range(len(levelmaps_filter)): 
                                        if levelmaps_filter[n].childLevel == levelmaps_filter[p].level:
                                            break
                                        elif p == len(levelmaps_filter) - 1:
                                            if levelmaps_filter[n].childLevel == all_columns[t].logicalColumn:
                                                for drill in all_columns[t].drillColumn:
                                                    drill_column = drillColumn()
                                                    drill_column.columnName = drill.columnName
                                                    drill_column.tableName = drill.tableName
                                                    drill_column.weight = 1
                                                    all_columns[m].add_drillColumn(drill_column)
                                    
                            
                            else:
                                for q in range(len(levelmaps_filter[n].levelKey)):
                                    if levelmaps_filter[n].levelKey[q].drillKey == ''  and levelmaps_filter[n].levelKey[q].columnName == all_columns[m].logicalColumn: #  column has no drillColumn if its drillKey != 'yes' 
                                          pass
                                    if count == 1 and levelmaps_filter[n].levelKey[q].columnName != all_columns[m].logicalColumn and q != l:
                                        drill_column = drillColumn()
                                        drill_column.columnName = levelmaps_filter[n].levelKey[l].columnName
                                        drill_column.tableName = levelmaps_filter[n].levelKey[l].tableName
                                        drill_column.weight = 0
                                        all_columns[m].add_drillColumn(drill_column)
                                        break
                                    if len(levelmaps_filter[n].levelKey) == 1:
                                        drill_column = drillColumn()
                                        drill_column.columnName = levelmaps_filter[n].levelKey[l].columnName
                                        drill_column.tableName = levelmaps_filter[n].levelKey[l].tableName
                                        drill_column.weight = 0
                                        all_columns[m].add_drillColumn(drill_column)
                                      
                                        
                                    
                                    elif levelmaps_filter[n].levelKey[q].drillKey == 'yes' and q != l:                                                       #  get drillColumn from the same level but itself
                                        drill_column = drillColumn()
                                        drill_column.columnName = levelmaps_filter[n].levelKey[l].columnName
                                        drill_column.tableName = levelmaps_filter[n].levelKey[l].tableName
                                        drill_column.weight = 0
                                        all_columns[m].add_drillColumn(drill_column)
                                        break
                    for s in range(len(levelmaps_filter)):         ##  get column whose childLevel has one or more parentLevel (but it is always has one)
                        if levelmaps_filter[n].childLevel == levelmaps_filter[s].level:
                            for t in range(len(levelmaps_filter[s].levelKey)):
                                if levelmaps_filter[s].levelKey[t].drillKey == 'yes':
                                    drill_column = drillColumn()
                                    drill_column.columnName = levelmaps_filter[s].levelKey[t].columnName
                                    drill_column.tableName = levelmaps_filter[s].levelKey[t].tableName
                                    drill_column.weight = 1
                                    if drill_column.columnName == all_columns[m].logicalColumn: 
                                        pass
                                    elif all_columns[m].dimLevel[0].dimension == levelmaps_filter[s].dimension :
                                    
                                        all_columns[m].add_drillColumn(drill_column)
                                        
               
    #if all_columns[m].type_ != 'Fact' and len(all_columns[m].dimLevel) == 0:  #get columns' drillcolumn whose dimlevels are 'null'
        #print '*********'
      #  for n_ in range(len(levelmaps_filter)):
         #   if levelmaps_filter[n_].childLevel == '' and all_columns[m].tableName == levelmaps_filter[n_].levelKey[0].tableName:
           # #    for t_ in range(len(levelmaps_filter[n_].levelKey)):
                #    if levelmaps_filter[n_].levelKey[t_].drillKey == 'yes':
                 #       drill_column = drillColumn()
                 ##       drill_column.columnName = levelmaps_filter[n_].levelKey[t_].columnName
                  #      drill_column.tableName = levelmaps_filter[n_].levelKey[t_].tableName
                  #      drill_column.weight = 0
                   #     all_columns[m].add_drillColumn(drill_column)
                                 
                  
               
    columns_.add_column(all_columns[m])   

#sub_file = './%s.xml' % (subject_area)
subs_file = 'metadata.xml'
out_file = open(subs_file,'a+')

obieeDrill.export(out_file,0)
out_file.close()
