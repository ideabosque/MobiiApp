namespace py simba
namespace php simba

service CacheService {
	void ping()
	string insert(1:list<map<string, string>> insertColumns, 2:string table)
	void update(1:list<map<string, string>> updateColumns, 2:string table)
	map<string, string> selectById(1:map<string, string> idColumn, 2:string table)
}
