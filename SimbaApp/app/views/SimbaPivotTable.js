SimbaApp.views.SimbaPivotTable = Ext.extend(Ext.Panel, {
    // layout: 'fit',
	simba : this.simba,
	scroll: false,
	layout: {
		type: 'vbox',
		align: 'stretch'
	},
				
    initComponent: function() {
		var me = this;
		me.simbatype = 'simbapivottable';

		me.store = me.buildStore();
		me.buildPageByToolbar();

		me.id = me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
        SimbaApp.views.SimbaPivotTable.superclass.initComponent.call(me, arguments);
    },
	
	buildStore: function(columnInfo,data){
		var me = this,
			columnInfo = columnInfo || me.simbaview.viewInfo.columnInfo,
			data = data || me.simbaview.viewInfo.data,
			store,
			fields = [];
		for(var k in columnInfo){
			var field = {
				name: k,
				type: 'string'//columnInfo[k].dataType
			};
			fields.push(field);
		}
		store = new Ext.ux.SimbaStore({
			fields: fields,
			data  : data
		});
		// console.log('store',store);
		return store;
	},
	
	
	buildPageByToolbar: function(){
		var me = this,
			items = [],
			viewInfo = me.simbaview.viewInfo;

		if(Ext.isObject(viewInfo.page.columns)){
			var columns = viewInfo.page.columns;
			for(var column in columns){
				var item = me.createPageSelect(column,'page');				
				items.push(item);
			}
		}
		
		if(Ext.isObject(viewInfo.section.columns)){
			var columns = viewInfo.section.columns;
			for(var column in columns){
				var item = me.createPageSelect(column,'section');				
				items.push(item);
			}
		}
		// console.log(me.pagecid + '_store',me.store);
		if(items.length >0){
			me.dockedItems = me.dockedItems || [];
			// me.pageByForm = new Ext.form.FormPanel({
			me.pageByForm = new Ext.Toolbar({
				scroll: 'horizontal',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				defaults: { width: 300 },
				standardSubmit : false,
				// ui   : 'light',
				items: items,
				getValues: function(){
					// console.log(this.items.items);
					var values = {};
					if(this.items.items){
						for (var i = 0; i < this.items.items.length; i++){
							var item = this.items.items[i];
							values[item.name] = item.value;
						}
					}
					return values;
				}
			});
			me.dockedItems.unshift(me.pageByForm);
		}
    	me.items = me.createContent(me.store);
	},
	
	createPageSelectData: function(column,pageType){
		var me = this,
			data = [],
			tempData = me.store.collect(column),
			viewInfo = me.simbaview.viewInfo,
			pageTotal = viewInfo.page.total,
			sectionTotal = viewInfo.section.total;
		
		// console.log('tempData',tempData);
		Ext.each(tempData,function(item,index,allItems){
			var option = {
				text: item,
				value: item
			};
			data.push(option);
		});	
		
		if(pageType === 'section'){
			var option = {
				text : viewInfo.section.totalLabel || 'All Sections',
				value: 'All Sections'
			};
			if(sectionTotal === 'before') data.unshift(option);
			else if (sectionTotal === 'after') data.push(option);
		} else if (pageType === 'page'){
			var option = {
				text :  viewInfo.page.totalLabel || 'All Pages',
				value: 'All Pages'
			};
			if(pageTotal === 'before') data.unshift(option);
			else if (pageTotal === 'after') data.push(option);
		} 
		if(data[0].value !== 'All Pages' && data[0].value !== 'All Sections') me.store.filter(column, data[0].value); 
		return data;
	},
	
	createPageSelect: function(column,pageType){
		var me = this,
			data = me.createPageSelectData(column,pageType);
			label = me.simbaview.viewInfo.columnInfo[column].columnHeading + ':',
			selectStore = new Ext.data.Store({
				fields : [
					{ name : "text",  type : "string" },
					{ name : "value", type : "string" }
				]
			});
		selectStore.loadData(data);
		
		var item = {
			xtype: 'selectfield',
			name : column,
			label: label,
			labelWidth: '50%',
			store: selectStore,
			displayField: 'text',
			valueField  : 'value',
			pageType : pageType,
			value: data[0].get('value'),
			// ui: 'black',
			listeners:{
				change: function(selectField,v){
					me.store.clearFilter();
					var selections = me.pageByForm.getValues();
					var pageByFormItems = me.pageByForm.items.items;
					var idx = pageByFormItems.indexOf(selectField);
					var i =0;
					if(v==='All Pages'){
						me.store.clearFilter();
						Ext.each(pageByFormItems,function(pageByFormItem,index,allItems){
							if(pageByFormItem.pageType === 'page') pageByFormItem.setValue('All Pages');
							else {
								var data = me.createPageSelectData(pageByFormItem.name, 'section');
								pageByFormItem.store.loadData(data);
								pageByFormItem.setValue(data[0].value);
							}
						});
					} else if(v==='All Sections'){
						Ext.each(pageByFormItems,function(pageByFormItem,index,allItems){
							if (index < idx) {
								// console.log('pass');
							} else {
								if(pageByFormItem.pageType === 'section') pageByFormItem.setValue('All Sections');
								else {
									var data = me.createPageSelectData(pageByFormItem.name, 'section');
									pageByFormItem.store.loadData(data);
									pageByFormItem.setValue(data[0].value);
								}
							}
						});
					} else {
						me.store.filter(selectField.name,v);
						Ext.each(pageByFormItems,function(pageByFormItem,index,allItems){
							if (index <= idx) {
								// console.log('pass',pageByFormItem.name);
							} else {
								var data = me.createPageSelectData(pageByFormItem.name, 'section');
								pageByFormItem.store.loadData(data);
								pageByFormItem.setValue(data[0].value);
							}
						});
					}
					me.removeAll();
					// console.log(me.pagecid + me.reportid, me.store);
					me.add(me.createContent(me.store));
					me.doLayout();
				},
				afterrender: function(select){
					var labelEl = select.getEl().first('div.x-form-label');
					if (labelEl){
						labelEl.setStyle('color', 'white');
						labelEl.setStyle('background-color', 'black');
						labelEl.setStyle('background', 'transparent');
					}
				}
			}
		};
		
		
		return item;
			
	},
	
	calcContentHeight: function(){
		// return (rows + 2) * 37;
		var me = this;
		var w=window,
			d=document,
			e=d.documentElement,
			g=d.getElementsByTagName('body')[0],
			x=w.innerWidth||e.clientWidth||g.clientWidth,
			y=w.innerHeight||e.clientHeight||g.clientHeight;
		// console.log(x);
		// console.log(y);
		// var height = Ext.is.Phone ? 480 -20 -44 : 768 -20 -44;
		if(!Ext.is.Blackberry){
			if(me.pageByForm) return y - 46 -46 -40 -82;
			else return y - 46 -46 -40;
		} else {
			if(me.pageByForm) return y - 46 -82;
			else return y - 46;
		}
	},
	
	encodeValue: function(v){
		return v.replace(/[^a-zA-Z0-9]+/g,'');
	},
	
	createContentStoreLoC: function(pagedStore,pageColumns,sectionColumns,columnColumns,rowColumns,measureColumns){
		var me = this,
			viewInfo = me.simbaview.viewInfo,
			columnInfo = viewInfo.columnInfo,
			pageColumns = pageColumns || viewInfo.page.columns,
			sectionColumns = sectionColumns || viewInfo.section.columns,
			columnColumns = columnColumns || viewInfo.column.columns,
			rowColumns = rowColumns || viewInfo.row.columns,
			measureColumns = measureColumns || viewInfo.measure.columns,
			fields = [],
			records = [],
			psrColumns = [],
			rColumns = [],
			mColumns = [],
			groups,
			cColumnValues = [],
			data = [],
			pageKeys = [],
			sectionKeys = [],
			columnKeys = [],
			rowKeys = [],
			rowTotal = viewInfo.row.total,
			columnTotal = viewInfo.column.total;
			
		if(me.pageByForm){
			var selections = me.pageByForm.getValues();
			if(Ext.isObject(pageColumns)){
				for(var column in pageColumns){
					if(selections[column] === 'All Pages') break;
					else pageKeys.push(column);
				}
			}
			if(Ext.isObject(sectionColumns)){
				for(var column in sectionColumns){
					if(selections[column] === 'All Sections') break;
					else sectionKeys.push(column);
				}
			}
		}
		
		for(var k in columnInfo){
			if(rowColumns[k]){
				var field = {
					name: k,
					type: columnInfo[k].dataType
				};
				fields.push(field);
			}
		}
		
		if(Ext.isObject(columnColumns)){
			for(var column in columnColumns){
				columnKeys.push(column);
			}
			var columnGroups = pagedStore.groupBy(columnKeys);
			for(var mColumn in measureColumns){
				if(columnTotal == 'before'){
					var field = {
						name: mColumn + '-total',
						type: 'string'
					};
					fields.push(field);
				}
				Ext.each(columnGroups,function(cGroup,index,columnGroups){
					var xyz = mColumn + me.encodeValue(cGroup.name);
					var field = {
						name: xyz,
						type: 'string'//(columnInfo[mColumn].dataType === 'string') ? 'float' : columnInfo[mColumn].dataType
					};
					fields.push(field);
				});
				if(columnTotal == 'after'){
					var field = {
						name: mColumn + '-total',
						type: 'string'
					};
					fields.push(field);
				}
			}
		} else {
			for(var mColumn in measureColumns){
				var field = {
					name: mColumn,
					type: 'string'//(columnInfo[mColumn].dataType === 'string') ? 'float' : columnInfo[mColumn].dataType
				};
				fields.push(field);
			}
		}
		if(Ext.isObject(rowColumns)){
			var rowTotalData = {};
			var j = 0;
			for(var column in rowColumns){
				rowKeys.push(column);
				rowTotalData[column] = (j === 0) ? viewInfo.row.totalLabel || 'Grand Total' : '';
				j ++ 
			}
			var rowGroups = pagedStore.groupBy(rowKeys);
			var pscrKeys = [].concat(pageKeys,sectionKeys,columnKeys,rowKeys);
			var psrKeys = [].concat(pageKeys,sectionKeys,rowKeys);
			var pscKeys = [].concat(pageKeys,sectionKeys,columnKeys);
			var psKeys = [].concat(pageKeys,sectionKeys);
			pscrKeys.sort();
			psrKeys.sort();
			pscKeys.sort();
			psKeys.sort();
			Ext.each(rowGroups,function(rGroup,index,rowGroups){
				var row = {};
				for(var column in rowColumns){
					row[column] = rGroup.data[column];
				}
				for(var mColumn in measureColumns){
					var dataKeys = [mColumn].concat(pscrKeys);
					var columnTotalKeys = [mColumn].concat(psrKeys);
					var rowTotalKeys = [mColumn].concat(pscKeys);
					var rcTotalKeys = [mColumn].concat(psKeys);
					var dataKey = dataKeys.join(',');
					var columnTotalKey = columnTotalKeys.join(',');
					var rowTotalKey = rowTotalKeys.join(',');
					var rcTotalKey = rcTotalKeys.join(',');
					// console.log('columnTotalKey',columnTotalKey);
					// console.log('rGroup',rGroup);
					if(Ext.isObject(columnColumns)){
						Ext.each(columnGroups,function(cGroup,cIdx,columnGroups){
							var xyz = mColumn + me.encodeValue(cGroup.name);
							Ext.each(rGroup.children, function(child,rIdx,children){
								var cData = [];
								for(var c in cGroup.data){
									cData.push(child.data[c]);
								}
								var cDataStr = cData.join('~');
								if(cDataStr === cGroup.name){
									row[mColumn + '-total'] = child.data[columnTotalKey];
									row[xyz] = child.data[dataKey] || child.data[mColumn+',byall'];
									rowTotalData[xyz] = child.data[rowTotalKey];
									rowTotalData[mColumn + '-total'] = child.data[rcTotalKey];
								}
							});
						
						});
					} else {
						row[mColumn] = rGroup.children[0].data[dataKey] || rGroup.children[0].data[mColumn+',byall'];
						rowTotalData[mColumn] = rGroup.children[0].data[rowTotalKey];
					}
				}
				row['rowAgg'] = false;
				data.push(row);
			});
			rowTotalData['rowAgg'] = true;
			if(rowTotal === 'before'){
				data.unshift(rowTotalData);
			} else if(rowTotal === 'after'){
				data.push(rowTotalData)
			} 
		}
		var store = new Ext.ux.SimbaStore({
			fields: fields,
			data  : data,
			pageSize: 30,
			sorters: [{
				property : fields[0]
			}]
		});
		return store;
	},
	
	
	createContentStoreLoR: function(pagedStore,pageColumns,sectionColumns,columnColumns,rowColumns,measureColumns){
		var me = this,
			viewInfo = me.simbaview.viewInfo,
			columnInfo = viewInfo.columnInfo,
			pageColumns = pageColumns || viewInfo.page.columns,
			sectionColumns = sectionColumns || viewInfo.section.columns,
			columnColumns = columnColumns || viewInfo.column.columns,
			rowColumns = rowColumns || viewInfo.row.columns,
			measureColumns = measureColumns || viewInfo.measure.columns,
			fields = [],
			records = [],
			psrColumns = [],
			rColumns = [],
			mColumns = [],
			groups,
			cColumnValues = [],
			data = [],
			pageKeys = [],
			sectionKeys = [],
			rowKeys = [],
			columnKeys = [],
			rowTotal = viewInfo.row.total,
			columnTotal = viewInfo.column.total;
		
		var labelField = {
			name: 'measureLables',
			type: 'string'
		};
		
		if(me.pageByForm){
			var selections = me.pageByForm.getValues();
			if(Ext.isObject(pageColumns)){
				for(var column in pageColumns){
					if(selections[column] === 'All Pages') break;
					else pageKeys.push(column);
				}
			}
			if(Ext.isObject(sectionColumns)){
				for(var column in sectionColumns){
					if(selections[column] === 'All Sections') break;
					else sectionKeys.push(column);
				}
			}
		}
		
		for(var k in columnInfo){
			if(rowColumns[k]){
				var field = {
					name: k,
					type: columnInfo[k].dataType
				};
				fields.push(field);
			}
		}
		
		if(Ext.isObject(columnColumns)){
			for(var column in columnColumns){
				columnKeys.push(column);
			}
			var columnGroups = pagedStore.groupBy(columnKeys);
			if(columnTotal == 'before'){
				var field = {
					name: 'measuretotal',
					type: 'string'//'float'
				};
				fields.push(field);
			}
			Ext.each(columnGroups,function(cGroup,index,columnGroups){
				var xyz = 'measureValues' + me.encodeValue(cGroup.name);
				var field = {
					name: xyz,
					type: 'string'//'float'
				};
				fields.push(field);
			});
			if(columnTotal == 'after'){
				var field = {
					name: 'measuretotal',
					type: 'string'//'float'
				};
				fields.push(field);
			}
		} else {
			var field = {
				name: 'measureValues',
				type:  'string'//'float'
			};
			fields.push(field);
		}
		
		if(viewInfo.row.LabelPos == "0") fields.unshift(labelField);
		else fields.push(labelField);
		
		
		if(Ext.isObject(rowColumns)){
			for(var column in rowColumns){
				rowKeys.push(column);
			}
			var pscrKeys = [].concat(pageKeys,sectionKeys,columnKeys,rowKeys);
			var psrKeys = [].concat(pageKeys,sectionKeys,rowKeys);
			var rowGroups = pagedStore.groupBy(rowKeys);
			pscrKeys.sort();
			psrKeys.sort();
			for(var mColumn in measureColumns){
				var dataKeys = [mColumn].concat(pscrKeys);
				var columnTotalKeys = [mColumn].concat(psrKeys);
				var dataKey = dataKeys.join(',');
				var columnTotalKey = columnTotalKeys.join(',');
				Ext.each(rowGroups,function(rGroup,index,rowGroups){
					var row = {};
					// console.log('rGroup',rGroup);
					// console.log('columnTotalKey',columnTotalKey);
					row['measuretotal'] = rGroup.children[0].data[columnTotalKey];
					Ext.each(rGroup.children, function(child,index,children){
						row['measureLables'] = columnInfo[mColumn].columnHeading;
						for(var column in rowColumns){
							row[column] = rGroup.data[column];
						}
						if(Ext.isObject(columnColumns)){
							for(var cColumn in columnColumns){
								var xyz = 'measureValues' + me.encodeValue(child.data[cColumn]);
								row[xyz] = child.data[dataKey];
							}
						} else {
							row['measureValues'] = pagedStore.data.items[0].data[dataKey];
						}
					});
					data.push(row);
				});
				
			}
		} else {
			var pscrKeys = [].concat(pageKeys,sectionKeys,columnKeys,rowKeys);
			var psrKeys = [].concat(pageKeys,sectionKeys,rowKeys);
			pscrKeys.sort();
			psrKeys.sort();
			for(var mColumn in measureColumns){
				var dataKeys = [mColumn].concat(pscrKeys);
				var columnTotalKeys = [mColumn].concat(psrKeys);
				var dataKey = dataKeys.join(',');
				var columnTotalKey = columnTotalKeys.join(',');
				var row = {};
				row['measureLables'] = columnInfo[mColumn].columnHeading;
				if(Ext.isObject(columnColumns)){
					// console.log('columnGroups',columnGroups);
					row['measuretotal'] = columnGroups[0].children[0].data[columnTotalKey];
					Ext.each(columnGroups,function(cGroup,index,columnGroups){
						// console.log('columnTotalKey',columnTotalKey);
						// console.log('cGroup',cGroup);
						var xyz = 'measureValues' + me.encodeValue(cGroup.name);
						Ext.each(cGroup.children, function(child,index,children){
							row[xyz] = child.data[dataKey];
						});
					});
				} else {
					row['measureValues'] = pagedStore.data.items[0].data[dataKey];
				}
				data.push(row);
			}
		}
		
		var store = new Ext.ux.SimbaStore({
			fields: fields,
			data  : data,
			pageSize: 30,
			sorters: [{
				property : fields[0]
			}]
		});
		// console.log(me.pagecid +'-' +  me.reportid + '-' + me.simbaview.viewName +'-store', store);
		return store;
	},
	
	createPivotChartStore: function(pagedStore,pageColumns,sectionColumns,columnColumns,rowColumns,measureColumns){
		var me = this,
			viewInfo = me.simbaview.viewInfo,
			columnInfo = viewInfo.columnInfo,
			pageColumns = pageColumns || viewInfo.page.columns,
			sectionColumns = sectionColumns || viewInfo.section.columns,
			columnColumns = columnColumns || viewInfo.column.columns,
			rowColumns = rowColumns || viewInfo.row.columns,
			measureColumns = measureColumns || viewInfo.measure.columns,
			fields = [],
			records = [],
			psrColumns = [],
			rColumns = [],
			mColumns = [],
			groups,
			cColumnValues = [],
			data = [],
			pageKeys = [],
			sectionKeys = [],
			rowKeys = [],
			columnKeys = [],
			rowTotal = viewInfo.row.total;
		
		var labelField = {
			name: 'measureLables',
			type: 'string'
		};
		
		if(me.pageByForm){
			var selections = me.pageByForm.getValues();
			if(Ext.isObject(pageColumns)){
				for(var column in pageColumns){
					if(selections[column] === 'All Pages') break;
					else pageKeys.push(column);
				}
			}
			if(Ext.isObject(sectionColumns)){
				for(var column in sectionColumns){
					if(selections[column] === 'All Sections') break;
					else sectionKeys.push(column);
				}
			}
		}
		
		if(Ext.isObject(rowColumns)){
			for(var column in rowColumns){
				rowKeys.push(column);
				var field = {
					name: column,
					type: columnInfo[column].dataType
				};
				fields.push(field);
			}
		}
		
		if(Ext.isObject(columnColumns)){
			for(var column in columnColumns){
				columnKeys.push(column);
				var field = {
					name: column,
					type: columnInfo[column].dataType
				};
				fields.push(field);
			}
		}
		
		if(Ext.isObject(measureColumns)){
			for(var column in measureColumns){
				var field = {
					name: column,
					type: 'string' //(columnInfo[column].dataType === 'string') ? 'float' : columnInfo[column].dataType
				};
				fields.push(field);
			}
		}
		
		var pscrKeys = [].concat(pageKeys,sectionKeys,columnKeys,rowKeys);
		var crKeys = [].concat(columnKeys,rowKeys);
		pscrKeys.sort();
		crKeys.sort();
		var pscrGroups = pagedStore.groupBy(pscrKeys,false);
		// console.log('pscrGroups',pscrGroups);
		
		Ext.each(pscrGroups,function(group,index,allGroups){
			var row = {};
			for(var cr in crKeys){
				var crKey = crKeys[cr];
				row[crKey] = group.children[0].data[crKey];
			}
			for(var mColumn in measureColumns){
				var dataKeys = [mColumn].concat(pscrKeys);
				var dataKey = dataKeys.join(',');
				row[mColumn] = group.children[0].data[dataKey];
			}
			data.push(row);
		});
		
		var store = new Ext.ux.SimbaStore({
			fields: fields,
			data  : data,
			pageSize: 30,
			sorters: [{
				property : fields[0]
			}]
		});
		
		// console.log(me.pagecid +'-' +  me.reportid + '-' + me.simbaview.viewName +'-chartstore', store);
		return store;
	},
	
	createContent: function(pagedStore){
		var me = this,
			columnInfo = me.simbaview.viewInfo.columnInfo,
			viewInfo = me.simbaview.viewInfo,
			rowColumns = viewInfo.row.columns,
			columnColumns = viewInfo.column.columns,
			measureColumns = viewInfo.measure.columns,
			rowTotal = viewInfo.row.total,
			items = [];
		if(me.pageByForm){
			var selections = me.pageByForm.getValues();
			for(var k in selections){
				var v = selections[k];
				if(v==='All Pages' || v==="All Sections"){
					continue;
				} else {
					pagedStore.filter(k, v);
				}
			}
		}
		
		var colModel = me.buildColumnModels(pagedStore);
		if(viewInfo.LabelPos === 'column'){
			var gridStore = me.createContentStoreLoC(pagedStore);
		} else if(viewInfo.LabelPos === 'row'){
			var gridStore = me.createContentStoreLoR(pagedStore);
		} else {
			var gridStore = pagedStore;
		}
		
		var item = me.buildContent(gridStore,pagedStore,"",colModel);
		items.push(item);
		return items;
	},
	
	buildColumnModels: function(store){
		var me = this,
			colInfo = me.simbaview.viewInfo.columnInfo,
			rowColInfo = {},
			rmColInfo = {},
			columnGroups,
			viewInfo = me.simbaview.viewInfo,
			cColumns = [],
			cColumnValues = [],
			rColumns = [],
			rColumnValues = [],
			store = store || me.store,
			i = 0,
			labelPos = viewInfo.LabelPos,
			columnTotal = viewInfo.column.total,
			dimColModel,factColModel = [];
		
		if(Ext.isObject(viewInfo.column.columns)){
			var columns = viewInfo.column.columns;
			for(var column in columns){
				cColumns.push(column);
			}
			columnGroups = store.groupBy(cColumns);
			Ext.each(columnGroups, function(cGroup,index,columnGroups){
				cColumnValues.push(cGroup.name);
			});
		}
		
		if(Ext.isObject(viewInfo.row.columns)){
			var columns = viewInfo.row.columns;
			for(var column in columns){
				rColumns.push(column);
			}
			rowGroups = store.groupBy(rColumns);
			Ext.each(rowGroups, function(rGroup,index,rowGroups){
				rColumnValues.push(rGroup.name);
			});
		}
		if(Ext.isObject(viewInfo.measure.columns)){
			var columns = viewInfo.measure.columns;
			var mCMs = [];
			if(labelPos === 'column'){
				if(Ext.isObject(viewInfo.row.columns)){
					var columns = viewInfo.row.columns;
					var rCMs = [];
					for(var column in columns){
						if(cColumnValues.length > 0){
							var header = [];
							header[0] = "";
							header[1] = colInfo[column].columnHeading;
						} else {
							header = colInfo[column].columnHeading;
						}
						var cm = {
							header   : header,
							mapping  : column,
							style    : "text-align: left;",
							drillThrough: colInfo[column].drillthrough_cid || false
						};
						rCMs.push(cm);
					}
					dimColModel = dimColModel || [rCMs.shift()];
					factColModel = factColModel.concat(rCMs);
				}
				if(viewInfo.column.LabelPos == "0"){
					for(var column in viewInfo.measure.columns){
						if(cColumnValues.length > 0){
							if(columnTotal == 'before'){
								var cm = {
									header   : colInfo[column].columnHeading + ' Total',
									mapping  : column + '-total',
									style    : "text-align: center;",
									drillThrough: colInfo[column].drillthrough_cid || false,
									width    : 150,
									dataFormat: colInfo[column].dataFormat || false,
									columnTotal: true
								};
								mCMs.push(cm);
							}
							Ext.each(cColumnValues, function(cColumnValue,index,cColumnValues){
								var header = [];
								header[0] = colInfo[column].columnHeading;
								header[1] = cColumnValue;
								var xyz = column + me.encodeValue(cColumnValue);
								var cm = {
									header   : header,
									mapping  : xyz,
									style    : "text-align: center;",
									drillThrough: colInfo[column].drillthrough_cid || false,
									width    : 150,
									dataFormat: colInfo[column].dataFormat || false,
								};
								mCMs.push(cm);
							});
							if(columnTotal == 'after'){
								var cm = {
									header   : colInfo[column].columnHeading + ' Total',
									mapping  : column + '-total',
									style    : "text-align: center;",
									drillThrough: colInfo[column].drillthrough_cid || false,
									width    : 150,
									dataFormat: colInfo[column].dataFormat || false,
									columnTotal: true
								};
								mCMs.push(cm);
							}
						} else {
							var cm = {
								header   : colInfo[column].columnHeading,
								mapping  : column,
								style    : "text-align: center;",
								drillThrough: colInfo[column].drillthrough_cid || false,
								width    : 150,
								dataFormat: colInfo[column].dataFormat || false,
							};
							mCMs.push(cm);
						}
					}
				} else {
					if(cColumnValues.length > 0){
						Ext.each(cColumnValues, function(cColumnValue,index,cColumnValues){
							for(var column in viewInfo.measure.columns){
								var header = [];
								header[0] = cColumnValue;
								header[1] = colInfo[column].columnHeading;
								var xyz = column + me.encodeValue(cColumnValue);
								var cm = {
									header   : header,
									mapping  : xyz,
									style    : "text-align: center;",
									drillThrough: colInfo[column].drillthrough_cid || false,
									width    : 150,
									dataFormat: colInfo[column].dataFormat || false,
								};
								mCMs.push(cm);
							}
						});
					}
				}
				
				dimColModel = dimColModel || [mCMs.shift()];
				factColModel = factColModel.concat(mCMs);
			} else if (labelPos === 'row'){
				for(var mColumn in viewInfo.measure.columns){
					if(colInfo[mColumn].dataFormat) break;
				}
				var labelCM = {
					header   : '',
					mapping  : 'measureLables',
					style    : "text-align: left;",
					width    : 150
				};
				var totalCM = {
					header   : 'Grand Total',
					mapping  : 'measuretotal',
					style    : "text-align: center;",
					width    : 150,
					columnTotal: true
				};
				if(viewInfo.row.LabelPos == "0"){
					dimColModel = dimColModel || [labelCM];
				} 
				if(Ext.isObject(viewInfo.row.columns)){
					var columns = viewInfo.row.columns;
					var rCMs = [];
					for(var column in columns){
						header = (cColumnValues.length > 0) ? colInfo[column].columnHeading : '';
						var cm = {
							header   : header,
							mapping  : column,
							style    : "text-align: left;",
							drillThrough: colInfo[column].drillthrough_cid || false
						};
						rCMs.push(cm);
					}
					dimColModel = dimColModel || [rCMs.shift()];
					factColModel = factColModel.concat(rCMs);
				}
				
				if(columnGroups && columnGroups.length > 0){
					if(columnTotal == 'befor'){
						mCMs.push(totalCM);
					}
					Ext.each(columnGroups, function(cGroup,cIndex,columnGroups){
						var xyz = 'measureValues' + me.encodeValue(cGroup.name);
						if(cColumns.length > 1){
							var header = [];
							for(var c in cColumns){
								header.push(cGroup.data[cColumns[c]]);
							}
						} else {
							var header = cGroup.name;
						}
						var cm = {
							header   : header,
							mapping  : xyz,
							style    : "text-align: center;",
							drillThrough: false,
							width    : 150,
							dataFormat: colInfo[mColumn].dataFormat || false,
						};
						mCMs.push(cm);
					});
					if(columnTotal == 'after'){
						mCMs.push(totalCM);
					}
				} else {
					var cm = {
						header   : '',
						mapping  : 'measureValues',
						style    : "text-align: center;",
						drillThrough: false,
						width    : 150,
						dataFormat: colInfo[mColumn].dataFormat || false,
					};
					mCMs.push(cm);
				}
					
				dimColModel = dimColModel || [mCMs.shift()];
				factColModel = factColModel.concat(mCMs);
				if(viewInfo.row.LabelPos != "0"){
					factColModel.push(labelCM);
				} 
			}
		}
		var colModel = {
			dimColModel : dimColModel,
			factColModel: factColModel
		};
		// console.log('colModel',colModel);
		return colModel;
	},
	
	measureRenderer: function(v){
		// if(v === 0) return '';
		if(Ext.isNumber(v)) return v.toFixed(1);
		else return v;
	},
    
    initScrollEvents: function(cmp){
		var me = this,
			dimHeader = cmp.getComponent(0).header,
			factHeader = cmp.getComponent(1).header,
			dimContent = cmp.getComponent(0).dataview,
			factContent = cmp.getComponent(1).dataview;
   	
    	factContent.on('itemtap',function(factContent,index,item,e){
        	dimContent.getSelectionModel().select(index);
        });

        dimContent.on('itemtap',function(dimContent,index,item,e){
        	factContent.getSelectionModel().select(index);
        });
		
		factContent.on('itemdoubletap',function(factContent,index,item,e){
			me.onRowDoubleTap(factContent,dimContent,index);
		});
		
		dimContent.on('itemdoubletap',function(dimContent,index,item,e){
			me.onRowDoubleTap(factContent,dimContent,index);
		});
		
		if(factHeader.scroller && factContent.scroller && dimContent.scroller){
			factHeader.scroller.updateBoundary();
			factContent.scroller.updateBoundary();
			dimContent.scroller.updateBoundary();
    	    factHeader.scroller.on('scroll',function(scroller, offsets) {
				var o = {
					x: - offsets.x,
					y: - factContent.scroller.getOffset().y
				};
				factContent.scroller.setOffset(o);
			});
			
			factContent.scroller.on('scroll',function(scroller, offsets) {
				var factHeaderX = - offsets.x,
				    factHeaderY = 0,
				    dimContentX = 0,
				    dimContentY = - offsets.y;
				factHeader.scroller.setOffset({x: factHeaderX,y: factHeaderY});
				dimContent.scroller.setOffset({x: dimContentX,y: dimContentY});
				
			});
			
			dimContent.scroller.on('scroll',function(scroller, offsets) {
				var o = {
					x: - factContent.scroller.getOffset().x,
					y: - offsets.y
				};
				factContent.scroller.setOffset(o);
			});
		}
    },
    
    setToolbarTitle: function(){
    	var me = this;
    	me.dockedItems = me.dockedItems || [];
    	me.toolbarBtns = [{xtype: 'spacer'}];
    	if(me.buttons) me.toolbarBtns.push(me.buttons);
    	me.titleToolbar = new Ext.Toolbar({
    		title: '',
    		items: me.toolbarBtns
    	});
        me.dockedItems.unshift(me.titleToolbar);
    },
	
	buildContent: function(gridStore,pagedStore,sectionTpl,colModel){
		var me = this,
			viewInfo = me.simbaview.viewInfo,
			ptChart = viewInfo.chart;
			
		if (sectionTpl) var dockedItems = [{html: sectionTpl}]
		else var dockedItems = [];
		
		if(ptChart){
			var ptChartStore = me.createPivotChartStore(pagedStore);
			if(ptChart.position === 'only'){
				me.simbatype = 'simbapivotchart';
				var item = new SimbaApp.views.SimbaChart({
					// height: me.calcContentHeight(),
					flex: 1,
					dockedItems: dockedItems,
					measures: ptChart.viewInfo.measures,
					series: ptChart.viewInfo.series,
					categories: ptChart.viewInfo.categories,
					pagecid: me.pagecid, 
					simbapageid: me.simbapageid,
					reportid: me.reportid, 
					simba: me.simba,
					simbaview: ptChart,
					store: ptChartStore,
					pivotchart: true
				});
			} else {
				var chartitem = new SimbaApp.views.SimbaChart({
					title   : 'Chart',
					measures: ptChart.viewInfo.measures,
					series: ptChart.viewInfo.series,
					categories: ptChart.viewInfo.categories,
					pagecid: me.pagecid, 
					simbapageid: me.simbapageid,
					reportid: me.reportid, 
					simba: me.simba,
					simbaview: ptChart,
					store: ptChartStore,
					pivotchart: true
				});
				if(!Ext.is.Phone && Ext.getOrientation() == 'portrait'){
					// chartitem.flex = 2;
					// var chartitem_alt = {
						// id : chartitem.id + '-alt',
						// title   : 'Chart',
						// layout: {
							// type: 'vbox',
							// align: 'stretch',
							// pack : 'center'
						// },
						// items: [{xtype:'spacer',flex: 1},chartitem,{xtype:'spacer',flex: 1}]
					// };
					chartitem.margin = '50%';
				}
				var griditem = me.buildContentGrid(gridStore,sectionTpl,colModel);
				griditem.title = 'Grid';
				// if(Ext.is.Phone){
					var item = new Ext.TabPanel({
						// height: me.calcContentHeight(),
						flex: 1,
						// items: (Ext.is.Phone) ? [chartitem,griditem] : [chartitem_alt,griditem],
						items: [chartitem,griditem] ,
						dockedItems: dockedItems,
						tabBar: {
							dock : 'top'
						}
					});
				// } else {
					// var item = {
						// flex: 1,
						// layout: {
							// type: 'vbox',
							// align: 'stretch'
						// },
						// defaults: {flex: 1},
						// items: [chartitem,griditem]
					// };
				// }
			}
		} else {
			var item = me.buildContentGrid(gridStore,sectionTpl,colModel);
		}
		return item;
	},
	
	calcFactFlex : function(dimColModel,store){
    	var me = this,
    		colModel  = dimColModel || me.dimColModel,
			store = store || me.store,
			ln = colModel.length,
			factFlex = 1,
			w=window,
			d=document,
			e=d.documentElement,
			g=d.getElementsByTagName('body')[0],
			x=w.innerWidth||e.clientWidth||g.clientWidth,
			y=w.innerHeight||e.clientHeight||g.clientHeight,
            width = 0;
        for (var i = 0; i < ln; i++) {
        	var col  = colModel[i],
				cellWidth = colModel[i].width = me.calcColumnWidth(col,store);
			width += cellWidth;
        }
		if(width > 0){
			if(Ext.is.Phone){
				factFlex = (width >= x-100) ? 1 : x/width -1;
			} else if(Ext.is.iPad) {
				factFlex = 750/width -1.5;
			} else {
				factFlex = (x-300)/width -1.5;
			}
		}
		if(factFlex < 1) factFlex = 1;
		// console.log('factFlex',factFlex);
        return factFlex;
    },
	
	calcColumnWidth: function(col,store){
		var me = this,
			header = col.header,
			maxLn = 0,
			store = store || me.store,
			colData = store.collect(col.mapping),
			colLn = colData.length;
		if(Ext.isArray(header)){
			Ext.each(header,function(h,hIdx,header){
				if(h && h.length > maxLn) maxLn = h.length;
				// else console.log('h',h);
			});
		} else {
			maxLn = header.length;
		}
		
		if(colLn>0){
			for(var i =0; i < colLn && i < 1000; i++){
				var x = colData[i] + '';
				var ln = x.length;
				if(ln > maxLn) maxLn = ln;
			}
		}
		
		return maxLn * 8 + 15;
	},
	
	buildContentGrid: function(store,sectionTpl,colModel,columnLayer){
		var me = this,
			viewInfo = me.simbaview.viewInfo,
			columnLayer = columnLayer || 0,
			ptChart = viewInfo.chart;

		if(Ext.isObject(viewInfo.column.columns)){
			for(var column in viewInfo.column.columns){
				columnLayer += 1;
			}
			if(viewInfo.LabelPos === 'column') columnLayer += 1;
		}
		
		
		
		columnLayer = (columnLayer === 0) ? 1 : columnLayer;
		
		if (sectionTpl) var dockedItems = [{html: sectionTpl}]
		else var dockedItems = [];
		
		var dimGrid = new Ext.ux.DimGridPanel({
			scroll: 'vertical',
			contentScroll: 'vertical',
			store       : store,
			multiSelect : false,
			flex: me.dimGridFlex ? me.dimGridFlex : 1,
			colModel    : colModel.dimColModel,
			columnLayer  : columnLayer || 1,
			pagecid: me.pagecid,
			simbapageid: me.simbapageid,
			reportid: me.reportid,
			viewname: me.simbaview.viewName
		});
		
		// if(me.factGridFlex) {
			// var factGridFlex = me.factGridFlex;
		// } else {
			// var factGridFlex = (Ext.is.Phone) ? 1 : 4;
		// }
		
		if(me.factGridFlex) {
    		factGridFlex = me.factGridFlex;
    	} else {
			factGridFlex = me.calcFactFlex(colModel.dimColModel,store);
    	}
		
		var factGrid = new Ext.ux.FactGridPanel({
			scroll: (Ext.is.Phone) ? 'vertical' : false,
			contentScroll: 'both',
			headerScroll : 'horizontal',
			scrollEvent  : false,
			store       : store,
			multiSelect : false,
			flex: factGridFlex,
			colModel    : colModel.factColModel,
			columnLayer  : columnLayer || 1,
			pagecid: me.pagecid,
			simbapageid: me.simbapageid,
			reportid: me.reportid,
			viewname: me.simbaview.viewName
		});
		
		dockedItems = me.buildPagingToolbar(dockedItems,store);
		
		var item = new Ext.Panel({
			// height: me.calcContentHeight(),
			flex: 1,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			store: store,
			scroll: 'vertical',
			cls   : 'x-simba-grid',
			items: [dimGrid, factGrid],
			dockedItems: ptChart ? [] : dockedItems,
			listeners: {
				scope       : me,
				// afterrender: me.enablePaging,
				afterlayout : me.initScrollEvents
			}
		});
		return item;
	},
	
	onRowDoubleTap: function(factContent,dimContent,index){
		var me = this;
		var rowDetailsForm = Ext.getCmp('mobiiapp-row-details-form');
		if(rowDetailsForm) rowDetailsForm.destroy();
		while (Ext.get('mobiiapp-row-details-form')){
			Ext.get('mobiiapp-row-details-form').remove();
		}
		var store = factContent.store;
		var baseNum = (store.currentPage - 1) * store.pageSize;
		var record = factContent.store.getAt(index);
		var dimColModel = dimContent.ownerCt.colModel;
		var factColModel = factContent.ownerCt.colModel;
		var colModel = dimColModel.concat(factColModel);
		var colLen = colModel.length;
		var dataLen = store.snapshot ? store.snapshot.length : store.getCount();
		var items = [];
		var rowDetailsFormbase = {
			items: [],
			scroll: 'vertical',
			cls: 'x-row-detail',
			fullscreen: true,
			id: 'mobiiapp-row-details-form',
			style: 'z-index: 100',
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				title: me.simbaview.caption ? me.simbaview.caption : me.simbaview.viewName,
				items: [{
					xtype: 'spacer'
				},{
					xtype: 'button',
					iconCls: 'delete',
					iconMask: true,
					handler: function(btn,e){
						// var ownerReport = SimbaApp.getOwnerbySimbatype(me,'simbareport');
						// if(ownerReport.preview){
							// ownerReport.show(); 
						// } else {
							// if(_offline){
								// SimbaApp.views.offlinePanel.show();
							// } else {
								// SimbaApp.views.viewport.show();
							// }
						// }
						var rowDetailsForm = Ext.getCmp('mobiiapp-row-details-form');
						rowDetailsForm.destroy();
						while (Ext.get('mobiiapp-row-details-form')){
							Ext.get('mobiiapp-row-details-form').remove();
						}
					}
				}]
			},{
				xtype: 'toolbar',
				dock : 'bottom',
				style: {'background': 'transparent',padding:0},
				items: [{
					xtype   : 'sliderfield',
					style   : {
						'background': 'transparent',
						'width': Ext.is.Phone ? '100%' : '90%',
						'margin': 0
					},
					label   : '',
					value   : index,
					minValue: 0,
					maxValue: store.getCount() -1,
					listeners: {
						change: function(slider,thumb,newValue,oldValue){
							var viewport = (_offline) ? SimbaApp.views.offlinePanel : SimbaApp.views.viewport,
								newRecord = store.getAt(newValue),
								rowDetailsForm = Ext.getCmp('mobiiapp-row-details-form');
							// rowDetailsForm.loadRecord(newRecord);
							var html = generateHTML(newRecord);
							rowDetailsForm.update(html);
							factContent.getSelectionModel().select(newValue);
							dimContent.getSelectionModel().select(newValue);
							var infoButton = slider.nextSibling();
							if(infoButton && infoButton.xtype == 'button') infoButton.setText((newValue + 1) + ' of ' + store.getCount());
						}
					}
				},{
					xtype: 'button',
					margin: 0,
					padding: '18 0 0 0',
					text : (index + 1) + ' of ' + store.getCount(),
					ui   : 'plain',
					hidden: Ext.is.Phone ? true : false
				}]
			}],
		};
		var generateHTML = function(record){
			var html = '<table style="width: 100%;">';
			for(var i=0; i<colLen; i++){
				var model = colModel[i];
				if(Ext.isArray(model.header)) var header = model.header.join(', ');
				else var header = model.header;
				if(header.indexOf(', ') == 0) header = header.substring(2);
				html += '<tr class="x-grid-row"><td width="40%" class="x-grid-cell">'+ 
							header + 
							'</td><td width="60%" class="x-grid-cell">'+ 
							record.get(model.mapping) +
							'</td></tr>';
			}
			html += '</table>';
			return html;
		};
		rowDetailsFormbase.html = generateHTML(record);
		// for(var i=0; i<colLen; i++){
			// var model = colModel[i];
			// if(Ext.isArray(model.header)) var header = model.header.join(', ');
			// else var header = model.header;
			// if(header.indexOf(', ') == 0) header = header.substring(2);
			// var item = {
				// xtype: 'textfield',
				// label: header,
				// labelWidth: '40%',
				// name: model.mapping,
				// value: record.get(model.mapping),
				// listeners: {
					// afterrender: function(ele) {
						// ele.fieldEl.dom.readOnly = true;
					// }
				// }
			// };
			// rowDetailsFormbase.items.push(item);
		// }
		// var ownerReport = SimbaApp.getOwnerbySimbatype(me,'simbareport');
		// if(ownerReport && ownerReport.preview){
			// ownerReport.hide(); 
		// } else {
			// if(_offline){
				// SimbaApp.views.offlinePanel.hide();
			// } else {
				// SimbaApp.views.viewport.hide();
			// }
		// }
		var rowDetailsForm = new Ext.form.FormPanel(rowDetailsFormbase);
		rowDetailsForm.show();
	},
	
	buildPagingToolbar: function(dockedItems,store){
		var me = this,
			viewInfo = me.simbaview.viewInfo,
			columnInfo = viewInfo.columnInfo,
			pageColumns = pageColumns || viewInfo.page.columns,
			sectionColumns = sectionColumns || viewInfo.section.columns,
			columnColumns = columnColumns || viewInfo.column.columns,
			rowColumns = rowColumns || viewInfo.row.columns,
			measureColumns = measureColumns || viewInfo.measure.columns,
			totalNum = store.snapshot ? store.snapshot.items.length : store.data.items.length,
			numPages = Math.ceil(totalNum / store.pageSize);

		if(totalNum > store.pageSize && !Ext.isObject(pageColumns) && !Ext.isObject(sectionColumns)){			
			var pagingSiderToolbar = new Ext.Toolbar({
				dock: 'bottom',
				style: {'background': 'transparent'},
				padding: 0,
				items: [{
					xtype   : 'sliderfield',
					style   : {
						'background': 'transparent',
						'width': Ext.is.Phone ? '100%' : '90%'
					},
					margin  : 0,
					label   : '',
					value   : 1,
					minValue: 1,
					maxValue: numPages,
					listeners: {
						change: function(slider,thumb,newValue,oldValue){
							var infoButton = slider.nextSibling();
							store.loadPageLocal(newValue);
							var cmp = pagingSiderToolbar.ownerCt;
							me.initScrollEvents(cmp);
							if(infoButton && infoButton.xtype == 'button') infoButton.setText(newValue + ' of ' + numPages);
						}
					}
				},{
					xtype: 'button',
					margin: 0,
					padding: '18 0 0 0',
					text : '1 of ' + numPages,
					ui   : 'plain',
					hidden: Ext.is.Phone ? true : false
				}]
			})
			store.loadPageLocal(1);
			dockedItems = dockedItems || [];
			dockedItems.push(pagingSiderToolbar);
		}
		return dockedItems;
	},
	
	enablePaging: function(cmp){
		var me = this,
			viewInfo = me.simbaview.viewInfo,
			columnInfo = viewInfo.columnInfo,
			pageColumns = pageColumns || viewInfo.page.columns,
			sectionColumns = sectionColumns || viewInfo.section.columns,
			columnColumns = columnColumns || viewInfo.column.columns,
			rowColumns = rowColumns || viewInfo.row.columns,
			measureColumns = measureColumns || viewInfo.measure.columns,
			totalNum = cmp.store.snapshot ? cmp.store.snapshot.items.length : cmp.store.data.items.length,
			numPages = Math.ceil(totalNum / cmp.store.pageSize);
			options = [],
			simbareport = Ext.getCmp(me.pagecid + '-' + me.reportid),
			pagingSelectField = simbareport.pagingSelectField;

		if(totalNum > cmp.store.pageSize && !Ext.isObject(pageColumns) && !Ext.isObject(sectionColumns)){			
			for (var i = 1; i <= numPages; i++) {
				options.push({ text: "Page "+i, value: i });
			}
			cmp.store.loadPageLocal(1);
			pagingSelectField.setOptions(options);
			pagingSelectField.addListener('change',function(select, value){
				cmp.store.loadPageLocal(value);
				me.initScrollEvents(cmp);
			});
			
			
			pagingSelectField.show();
		}
		
	}
});