import cx_Oracle

class OracleAdaptor:
	def __init__(self, uid, password, tnsname):
		conStr = uid + '/' + password + '@' + tnsname
		self.connection = cx_Oracle.connect(conStr)
	

	def insert(self, insertColumns, table):
		length = len(insertColumns)
		index = 0
		keyStr = ""
		valueStr = ""
                idCurrval = ""
		bindDict = dict()

		for insertColumn in insertColumns:
			index = index + 1

			key = insertColumn['key']
			type = insertColumn['type']
			value = insertColumn['value']
			keyStr = [(keyStr + key + ', '), (keyStr + key)][bool(index == length)]

			if type == 'id': 
				valueStr = [(valueStr + 'SEQ_' + value + '.NEXTVAL, '), (valueStr + 'SEQ_' + value + '.NEXTVAL')][bool(index == length)]
				idCurrval = 'SEQ_' + insertColumn['value'] + '.CURRVAL'
			elif type == 'funct':
				valueStr = [(valueStr + value + ', '), (valueStr + value)][bool(index == length)]
			elif type == 'variable':
				valueStr = [(valueStr + ':' + key + ', '), (valueStr + ':' + key)][bool(index == length)]
				bindDict[key] = value 
		
		sql = "INSERT INTO %s (%s) VALUES (%s)" % (table, keyStr, valueStr)
		cursor = self.connection.cursor()
		cursor.execute(sql, bindDict)
		self.connection.commit()
				
		sql = "SELECT %s FROM DUAL" % (idCurrval)
		cursor.execute(sql)
		id = cursor.fetchone()[0]
		cursor.close()
		return id
			
	
	def update(self, updateColumns, table):
		length = len(updateColumns)
		index = 0
		keyStr = ""
		valueStr = ""
		bindDict = dict()
		
		for updateColumn in updateColumns:
			index = index + 1
			
			key = updateColumn['key']
                        type = updateColumn['type']
                        value = updateColumn['value']

			if type == 'id':
                                keyStr  = '%s = :%s' % (key, key)
				bindDict[key] = value 
                        elif type == 'funct':
                                valueStr = [(valueStr + key + "=" + value + ', '), (valueStr + key + "=" + value)][bool(index == length)]
                        elif type == 'variable':
                                valueStr = [(valueStr + key + "=:" + key + ', '), (valueStr + key + "=:" + key)][bool(index == length)]
                                bindDict[key] = value

		sql = "UPDATE %s SET %s WHERE %s" % (table, valueStr, keyStr)	
                cursor = self.connection.cursor()
                cursor.execute(sql, bindDict)
		self.connection.commit()
                cursor.close()
	

	def selectById(self, idColumn, table):
		key = idColumn['key']
		type = idColumn['type']
                value = idColumn['value']

		sql = "SELECT * FROM %s WHERE %s = %s" % (table, key, value)
		cursor = self.connection.cursor()
		cursor.execute(sql)
		
		resultDict = dict()
		descriptions = cursor.description
		columns = cursor.fetchone()
		index = 0
		for column in columns:
			columnName = descriptions[index][0]
			resultDict[columnName] = str(column)
			index = index + 1		
		
		cursor.close()
		
		return resultDict 
		

	def __del__(self):
		self.connection.close()

