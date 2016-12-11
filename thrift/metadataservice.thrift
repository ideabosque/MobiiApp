namespace py metadataService
namespace php metadataService

struct DrillColumn {
    1: string columnName,
    2: string weight
}

struct Table {
    1: string tableName,
    2: string position
}

struct DimColumn {
    1: string columnName 
}

struct Column {
    1: string columnName,
    2: string columnAlias,
    3: string columnDesc,
    4: string nullable,
    5: string dataType,
    6: string aggregateable,
    7: string aggrRule,
    8: list<DrillColumn> drillColumns,
    9: list<Table> tables,
    10: list<DimColumn> dimColumns
}

struct Schema{
    1: string schemaName,
    2: string schemaDesc,
    3: list<Column> columns
}

struct PromptFilter{
	1: string formula,
	2: string schema,
	3: string op,
	4: string defaultOn,
	5: string defaultValue,
	6: string defaultValue2,
	7: string values,
	8: string control,
	9: string includeAllChoices,
	10: string constrainChoices,
	11: string setVariable,
	12: string setVariableValue,
	13: string type,
	14: string caption
}

struct Prompt{
	1: string promptName,
	2: string scope,
	3: list<PromptFilter> promptFilters
}

struct Report{
	1: string reportName,
	2: string reportSql 
}

struct Page{
	1: string pageName,
	2: map<string,i32> prompts,
	3: map<string,i32> reports
}

struct srcMetadataset {
    1: i32 cid,
    2: string appName,
    3: string style,
    4: map<string,i32> subs,
    5: map<string,string> savedFilters,
    6: string srcMetadata,
    7: Prompt prompt,
    8: Report report,
    9: Page page,
    10: string updateInfo
}

exception InvalidValueException {
    1: i32 error_code,
    2: string error_msg
}



service MetadataService {
	void ping(),
	map<string,map<string,string>> getTokens(),
	void delToken(1:list<string> paths),
	list<Schema> getSchemas(1:string path),
	list<Column> getColumns(1:string schemaName 2:string path),
	string setSchema(1:string path 2:Schema schema 3:string uid),
	string setColumn(1:string schemaName 2:Column column 3:string path 4:string uid),
	string addSchema(1:string path 2:Schema schema 3:string uid),
	string addColumn(1:string schemaName 2:Column column 3:string path 4:string uid),
	string delSchema(1:string path 2:Schema schema 3:string uid),
	string delColumn(1:string schemaName 2:Column column 3:string path 4:string uid),
	string saveMetadata(1:string path 2:string uid),
	string editMetadata(1:srcMetadataset m),
	string convert_metadata(1:srcMetadataset m) throws (1: InvalidValueException e),
	Prompt loadPromptDetails(1:string simbaXml) throws (1: InvalidValueException e)
}