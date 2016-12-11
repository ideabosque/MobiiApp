SimbaApp.views.SimbaTable = Ext.extend(Ext.Panel, {
    layout: 'fit',
	simba : this.simba,
	fullscreen: this.fullscreen ? true : false,
	
    initComponent: function() {
		var me = this;
		
		me.store = me.buildStore();
		me.buildColumnModels();
        
        me.items = me.gridPanel = me.buildGridPanel();
		me.buildPagingToolbar();
		me.listeners = {
			scope       : me,
			// afterrender: me.enablePaging,
			afterlayout : me.initScrollEvents
		};
		// me.html = '<span style="color:#D6B80A">' + me.pagecid + '-' + me.reportid + '-' + me.viewname + '-' + me.viewtype +'</span>';

		// me.id = me.id || me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
		me.id = me.extId ? me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName + me.extId: me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
		// console.log('tableId',me.id);
		
        SimbaApp.views.SimbaTable.superclass.initComponent.call(me, arguments);
    },
	
	buildPagingToolbar: function(){
		var me = this,
			totalNum = me.store.snapshot ? me.store.snapshot.items.length : me.store.data.items.length,
			numPages = Math.ceil(totalNum / me.store.pageSize);

		
		if(totalNum > me.store.pageSize && !me.preview){
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
							me.store.loadPageLocal(newValue);
							me.initScrollEvents(me);
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
			me.store.loadPageLocal(1);
			me.dockedItems = me.dockedItems || [];
			me.dockedItems.push(pagingSiderToolbar);
			// me.pagingSiderToolbar = pagingSiderToolbar;
		}
	},
	
	
	enablePaging: function(){
		var me = this,
			totalNum = me.store.snapshot ? me.store.snapshot.items.length : me.store.data.items.length,
			numPages = Math.ceil(totalNum / me.store.pageSize),
			options = [],
			simbareport = Ext.getCmp(me.pagecid + '-' + me.reportid),
			pagingSelectField = simbareport.pagingSelectField;

		
		if(totalNum > me.store.pageSize){
			for (var i = 1; i <= numPages; i++) {
				options.push({ text: "Page "+i, value: i });
			}
			pagingSelectField.setOptions(options);
			pagingSelectField.addListener('change',function(select, value){
				me.store.loadPageLocal(value);
				me.initScrollEvents(me);
			});
			pagingSelectField.show();
		}
		
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
				type: columnInfo[k].dataType
			};
			fields.push(field);
		}
		store = new Ext.ux.SimbaStore({
			fields: fields,
			data  : data,
			pageSize: 30
		});
		
		// store.loadData(data);
		// store.loadPageLocal(2);
		return store;
	},
	
	buildColumnModels: function(){
		var me = this,
			colInfo = me.simbaview.viewInfo.columnInfo,
			i = 0;
		me.factColModel = [];
		for(var col in colInfo){
			if(i ===0){
				me.dimColModel = [{
					header   : colInfo[col].columnHeading,
                	mapping  : col,
					drillThrough: colInfo[col].drillthrough_cid || false
				}]
			} else {
				var cm = {
					header   : colInfo[col].columnHeading,
                	mapping  : col,
                	style    : (colInfo[col].aggrRule === "none") ? "text-align: left;" : "text-align: center;",
					dataFormat: colInfo[col].dataFormat || false,
					drillThrough: colInfo[col].drillthrough_cid || false
				}
				me.factColModel.push(cm);
			}
			i ++;
		}
	},
    
    initScrollEvents: function(cmp){
    	var me = this,
    		dimHeader = me.dimGrid.header,
    		dimContent = me.dimGrid.items.get(0),
    		factHeader = me.factGrid.header,
    		factContent = me.factGrid.items.get(0);
   	
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
		// me.enablePaging();
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
	
	calcFactFlex : function(){
    	var me = this,
    		colModel  = me.dimColModel,
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
				cellWidth = colModel[i].width = me.calcColumnWidth(col);
			width += cellWidth;
        }
		if(width > 0){
			if(Ext.is.Phone){
				factFlex = 1;
			} else if(Ext.is.iPad) {
				factFlex = 750/width -1.5;
			} else {
				factFlex = (x-300)/width -1.5;
			}
		}
		if (factFlex < 1){
			factFlex = 1;
		}
		// console.log(factFlex);
        return factFlex;
    },
	
	calcColumnWidth: function(col){
		var me = this,
			header = col.header,
			maxLn = 0,
			colData = me.store.collect(col.mapping),
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
    
    buildGridPanel: function(){
    	var me = this,
    		dimGridFlex = me.dimGridFlex ? me.dimGridFlex : 1,
    		factGridFlex;
		
    	if(me.factGridFlex) {
    		factGridFlex = me.factGridFlex;
    	} else {
    		// factGridFlex = (Ext.is.Phone) ? 1 : 4;
			factGridFlex = me.calcFactFlex();
    	}
    	this.dimGrid = new Ext.ux.DimGridPanel({
            // scroll: (Ext.is.Phone) ? 'vertical' : false,
			scroll: 'vertical',
			contentScroll: 'vertical',
            store       : me.store,
            multiSelect : false,
            flex: dimGridFlex,
            colModel    : me.dimColModel,
			pagecid: me.pagecid,
			simbapageid: me.simbapageid,
			reportid: me.reportid,
			viewname: me.simbaview.viewName
        });
        
        this.factGrid = new Ext.ux.FactGridPanel({
            scroll: (Ext.is.Phone) ? 'vertical' : false,
            contentScroll: 'both',
            headerScroll : 'horizontal',
			scrollEvent : false,
            store       : me.store,
            multiSelect : false,
            flex: factGridFlex,
            colModel    : me.factColModel,
			pagecid: me.pagecid,
			simbapageid: me.simbapageid,
			reportid: me.reportid,
			viewname: me.simbaview.viewName
        });
    	
    	return new Ext.Panel({
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
			cls   : 'x-simba-grid',
            scroll: 'vertical',
            items: [this.dimGrid, this.factGrid]
        });
    }
});