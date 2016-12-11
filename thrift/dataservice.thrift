namespace py dataService
namespace php dataService

struct srcDataset {
  1: string appName,
  2: string requestxmlRaw,
  3: string simbaxmlRaw,
  4: string viewName,
  5: string viewType,
  6: string dataxmlRaw
}

struct srcQueryset {
	1: string appName,
	2: map<string,string> savedFilters,
	3: list<map<string,string>> prompts,
	4: map<string,string> columnSelector,
	5: map<string,string> drillColumn,
	6: string srcXml,
	7: string viewName,
	8: string viewType,
	9: string sql,
	10: string resultXml
}

exception dataService_InvalidValueException {
    1: i32 error_code,
    2: string error_msg
}

service DataService {
	void ping()
	string convert_data(1:srcDataset d) throws (1: dataService_InvalidValueException e)
	list<string> get_filters(1:srcQueryset srcQueryset) throws (1: dataService_InvalidValueException e),
	string get_requestXml(1:srcQueryset srcQueryset) throws (1: dataService_InvalidValueException e),
	string get_sqlResultSimba(1:srcQueryset srcQueryset) throws (1: dataService_InvalidValueException e),
	oneway void clear_list()
}