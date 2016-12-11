##from metadataconverter import *
##import metadatamanager
import metadatarenew


##src = 'form1.xml'
##m = MetadataConverter()
##m.cid = 2
##m.appName = 'sql'
##m.srcMetadata = src
##m.style = 'report'
##m.generateSimba()
##print m.simba

renewInfo = '{"columns":{"cc1":{"aggRule":"count","columnHeading":"Number of XXX"},"c1":{"aggRule":"none"},"c2":{"aggRule":"none"}},"views":[{"viewInfo":{"categories":["c1"],"series":[],"measures":["cc1"],"type":"line"},"viewType":"Chart","viewCaption":"New view 1","publish":1,"action":"add","viewName":"view_4021"}]}'
src = 'Spend_by_Top_Categories.xml'
m = metadatarenew.MetadataRenew()
result = m.renewMetadata(renewInfo,src)
print result
##print m.simba.application.appName
##
##print m.simba.application.report.criteria.subjectArea


##import xml.dom.minidom as dom

##doc = dom.parse('AP Balance All.xml')

##print doc.getElementsByTagName('saw:criteria')


##path = 'form1.xml'
##schemaName1 = 'CDP Waterfall'
##metadataManager = metadatamanager.MetadataManager()
####schemas = metadataManager.getSchemas(path)
####print schemas
##columns1 = metadataManager.getColumns(schemaName1,path)
##schemaName2 = 'B'
##columns2 = metadataManager.getColumns(schemaName2,path)
##metadataManager.setColumn(schemaName2,columns1[0],path,1)
##metadataManager.saveMetadata(path)
