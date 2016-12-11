Ext.ns("Ext.ux");

Ext.ux.SimbaStore = Ext.extend(Ext.data.Store, {
	initComponent : function() {
        Ext.ux.SimbaStore.superclass.initComponent.call(this);
    },
	
	collectBy: function(propertys, allowNull, bypassFilter){
		var values  = [],
			valuesX = [],
			uniques = {},
			uniquesX = {},
			valueX = '',
			uniqueKey = '',
			length, value, strValue, data, i;
		
		if (bypassFilter === true && this.snapshot) {
			data = this.snapshot.items;
		} else {
			data = this.data.items;
		}
		
		length = data.length;
		dataIndex = propertys[0];
		uniqueKey = propertys.join('');
		for (i = 0; i < length; i++) {
			valueX = '';
			Ext.each(propertys,function(property,index,propertys){
				valueX += data[i].data[property] + ',';
			});
			data[i].data[uniqueKey] = valueX = valueX.substr(0,valueX.length-1);
			// console.log(i, valueX);
			if ((allowNull || !Ext.isEmpty(valueX)) && !uniques[valueX]) {
				uniques[valueX] = true;
				values[values.length] = valueX;
			}
		}
		// console.log(data);
		return values;
	},
	
	addCombineData: function(propertys,bypassFilter){
		var valuesX = [],
			uniquesX = [],
			uniqueKey = propertys.join(','),
			valueX, length, data, i;
		
		if (bypassFilter === true && this.snapshot) {
			data = this.snapshot.items;
		} else {
			data = this.data.items;
		}
		
		length = data.length;
		if(length>0){
		if(!data[0].data[uniqueKey]){
			for (i = 0; i < length; i++) {
				valueX = '';
				uniquesX = [];
				Ext.each(propertys,function(property,index,propertys){
					uniquesX.push(data[i].data[property] );
					// valueX += data[i].data[property] + ',';
				});
				data[i].data[uniqueKey] = uniquesX.join(',');
			}
		}
		}
	},
	
	getGroupByString: function(instance,groupField) {
        return instance.get(groupField);
    },
	
	countBy: function(propertys,value,bypassFilter){
		var bypassFilter = (bypassFilter == undefined) ? false : bypassFilter;
		this.addCombineData(propertys,bypassFilter);
        var count = 0,
			uniqueKey = propertys.join(',');
			
		if (bypassFilter === true && this.snapshot) {
			var records = this.snapshot.items;
		} else {
			var records = this.data.items;
		}
		var length   = records.length;
		
        for (i = 0; i < length; i++) {
            var record = records[i];
			if(record.get(uniqueKey) == value){
				count = count + 1;
			}
        }
        
        return count;
	},
	
	groupBy: function(propertys,bypassFilter){
		var bypassFilter = (bypassFilter == undefined) ? false : bypassFilter;
		this.addCombineData(propertys,bypassFilter);
		// var records  = this.data.items,
			// length   = records.length,
        var groups   = [],
            pointers = {},
			groupField = propertys.join(','),
			data = {},
            record, groupStr, group, i;
			
		if (bypassFilter === true && this.snapshot) {
			var records = this.snapshot.items;
		} else {
			var records = this.data.items;
		}
		var length   = records.length;
		
        for (i = 0; i < length; i++) {
            record = records[i];
			data = {};
            groupStr = this.getGroupByString(record,groupField);
            group = pointers[groupStr];
			
			Ext.each(propertys,function(property,index,propertys){
				data[property] = record.get(property);
			});

            if (group == undefined) {
                group = {
                    name: groupStr,
                    children: [],
					data: data
                };

                groups.push(group);
                pointers[groupStr] = group;
            }

            group.children.push(record);
        }
        
        return groups;
	},

	groupBy1: function(propertys,cColumns,newfields,mColumns,sColumns){
	    var records  = this.data.items,
            length   = records.length,
            groups   = [],
            pointers = {},
            groupField = cColumns.join(','),
	        data = {},
            record, groupStr, group, i;

        for (i = 0; i < length; i++) {
            record = records[i];
	        data = {};
            groupStr = record.get(groupField);
            group = pointers[groupStr];

            Ext.each(cColumns,function(cColumn,index,cColumns){
			    data[cColumn] = record.get(cColumn);
            });

            if (group == undefined) {
                group = {
                    name: groupStr,
                    children: [],
		            data: data
                };
                groups.push(group);
                pointers[groupStr] = group;
            }
            group.children.push(record);
        }
        return groups;
	},

	groupBy2: function(propertys){
	     this.addCombineData(propertys);
	     var records  = this.data.items,
            length   = records.length,
            groups   = [],
            pointers = {},
	     groupField = propertys.join(','),
	     data = {},
            record, groupStr, group, i;

           for (i = 0; i < length; i++) {
            record = records[i];
	     data = {};
            groupStr = this.getGroupByString(record,groupField);
            group = pointers[groupStr];
            data[groupField] = record.get(groupField);
            if (group == undefined) {
                group = {
                    name: groupStr,
                    children: [],
		       data: data
                };
                groups.push(group);
                pointers[groupStr] = group;
            }
            group.children.push(record);
        }
        return groups;
	},

	sum : function(property, start, end) {
        var records = this.data.items,
            value   = 0,
            i;

        start = start || 0;
        end   = (end || end === 0) ? end : records.length - 1;

        for (i = start; i <= end; i++) {
            value += (parseFloat(records[i].data[property]) || 0);
        }

        return value;
    },	

	ssum : function(property, start, end) {
        var records = this.data.items,
            value = 0,
			rvalue = 0,
            i;

        start = start || 0;
        end   = (end || end === 0) ? end : records.length - 1;

        for (i = start; i <= end; i++) {

			if (records[i].data[property] == "")
			{ 
			}else{
			  rvalue +=1 ;
              value += parseFloat(records[i].data[property]);
			}
        }

        if (rvalue > 0)
        {return value;
        }else{
        return "";
		}
    },
    
    loadPageLocal: function(page){
		this.currentPage = page;
		this.snapshot = this.snapshot || this.data.clone();
		var totalNum = this.snapshot.items.length;
		var start = (page - 1) * this.pageSize ;
		var end = (page * this.pageSize > totalNum) ? totalNum : page * this.pageSize -1;
		this.loadData(this.snapshot.getRange(start,end));
	}
});

Ext.reg("simbastore", Ext.ux.SimbaStore);