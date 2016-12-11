namespace py contentService
namespace php contentService

struct srcPromptsSet {
	1: map<string,string> prompts,
	2: string filters
}

struct srcReportSet {
	1: string controller,
	2: string simbaxmlRaw,
	3: string requestxmlRaw
}


exception contentService_InvalidValueException {
    1: i32 error_code,
    2: string error_msg
}

service ContentService {
	void ping()
	string get_prompts_info(1:srcPromptsSet srcPromptsSet) throws (1: contentService_InvalidValueException e),
	string get_report_info(1:srcReportSet srcReportSet) throws (1: contentService_InvalidValueException e),
	oneway void clear_list()
}

