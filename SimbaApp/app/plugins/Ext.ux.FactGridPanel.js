Ext.ns("Ext.ux");

Ext.ux.FactGridPanel = Ext.extend(Ext.Panel, {
    layout        : "fit",

    multiSelect   : false,
    scroll        : (this.scroll !== 'undefined') ? this.scroll: false,
    headerScroll  : (this.headerScroll !== 'undefined') ? this.headerScroll : false,
    contentScroll : (this.contentScroll !== 'undefined') ? this.contentScroll : false,
	columnLayer  : this.columnLayer || 1,

    initComponent : function() {
        var me = this;
        me.checkRowAgg();
        me.width = me.calcWidth();
		me.dataview = new Ext.DataView(me.buildDataView());
        me.items = [me.dataview];

        if (!Ext.isArray(me.dockedItems)) {
            me.dockedItems = [];
        }

        me.header = new Ext.Component(me.buildHeader());
        me.dockedItems.push(me.header);
        
        Ext.ux.DimGridPanel.superclass.initComponent.call(me);

        var store = me.store;
        store.on("update", me.dispatchDataChanged, me);
		
		if(me.scrollEvent === true){
			me.listeners = {
				scope       : me,
				afterlayout : me.initScrollEvents
			};
		}

    },
	
	checkRowAgg: function(){
		var me = this;
		
		me.store.each(function(record,idx,total){
			// console.log(idx,record);
			if(record.get('rowAgg') == undefined) {
				record.data.rowAgg = false;
			}
			// console.log(record.get('rowAgg'));
		});
		
		// console.log('store',me.store);
	},
	
	initScrollEvents: function(cmp){
		var me = this,
			header = me.header,
			dataview = me.dataview;
		
		if(header.scroller && dataview.scroller){
			// console.log('factGrid',me);
			header.scroller.updateBoundary();
			dataview.scroller.updateBoundary();
			header.scroller.on('scrollend',function(scroller, offsets) {
				offsets.x = - offsets.x;
				offsets.y = - dataview.scroller.getOffset().y;
				dataview.scroller.setOffset(offsets);
			});
			
			dataview.scroller.on('scrollend',function(scroller, offsets) {
				offsets.x = - offsets.x;
				offsets.y = - header.scroller.getOffset().y;
				header.scroller.setOffset(offsets);
			});
		}
		
	},
    
    dispatchDataChanged: function(store, rec, operation) {
        var me = this;

        me.fireEvent("storeupdate", store, rec, operation);
    },
    
    calcWidth : function(){
    	var me = this,
    		colModel  = me.colModel,
            colNum    = me.getColNum(false),
			ln = colModel.length,
            width = 0;
        for (var i = 0; i < ln; i++) {
        	var col  = colModel[i],
				// cellWidth = colModel[i].width || 250;
				cellWidth = colModel[i].width = me.calcColumnWidth(col);
			width += cellWidth;
			if(i == 1) me.calcColumnWidth(col);
        }
        return width;
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

    buildHeader   : function() {
        var me        = this,
            colModel  = me.colModel,
            colNum    = me.getColNum(false),
            width     = me.width,
			trTpl,
            colTpl    = '<table class="x-grid-header" width="'+ width +'px">';
		for (var cl = 0; cl < me.columnLayer; cl ++){
			trTpl = '<tr>';
			var colspan = 1;
			var tdTpls = [];
			for (var i = 0; i < colModel.length; i++) {
				var col  = colModel[i],
					cellWidth = col.width || 250,
					header = Ext.isArray(col.header) ? col.header[cl] : col.header,
					tdTpl = "",
					cls  = "";
				if(cl >0 && col.columnTotal){
					header = '';
				}
				if (col.hidden) cls += " x-grid-col-hidden";
				if(i>0){
					var preCol = colModel[i-1],
						preHeader = Ext.isArray(preCol.header) ? preCol.header[cl] : preCol.header;
					if(header === preHeader){
						preCellWidth += cellWidth;
						colspan += 1;
						tdTpl += '<td height="30" colspan=' + colspan + ' width="' + preCellWidth + 'px" class="x-grid-cell x-grid-hd-cell x-grid-col-cell-merge">' + header + '</td>';
						tdTpls.pop();
						tdTpls.push(tdTpl);
					} else {
						preCellWidth = preCol.width || 250;
						colspan = 1;
						tdTpl += '<td height="30" width="' + cellWidth + 'px" class="x-grid-cell x-grid-hd-cell x-grid-col-' + col.mapping + cls + '" mapping="' + col.mapping + '">' + header + '</td>';
						tdTpls.push(tdTpl);
					}
				} else {
					var preCellWidth = cellWidth;
					tdTpl += '<td height="30" width="' + cellWidth + 'px" class="x-grid-cell x-grid-hd-cell x-grid-col-' + col.mapping + cls + '" mapping="' + col.mapping + '">' + header + '</td>';
					tdTpls.push(tdTpl);
				}
			}
			
			trTpl += tdTpls.join('') + '</tr>';
			colTpl += trTpl;
		}
		colTpl += '</table>';
        return {
            dock      : "top",
            html      : colTpl,
            scroll    : (Ext.is.Phone) ? 'horizontal' : me.headerScroll,
            listeners : {
                scope       : me,
                afterrender : me.initHeaderEvents
            }
        };
    },

    initHeaderEvents: function(cmp) {
        var me = this,
            el = cmp.getEl();
		// console.log('cmp_',cmp);
        el.on("click", me.handleHeaderClick, me);
    },

    handleHeaderClick: function(e, t) {
        e.stopEvent();

        var me      = this,
        	colModel  = me.colModel,
            el      = Ext.get(t),
            mapping = el.getAttribute("mapping");
//		console.log(mapping);
//		console.log(me.colModel);
		for (var i = 0; i < colModel.length; i++) {
			var col   = colModel[i];
			if(col.mapping === mapping) {
				var sortable = col.sortable || false;
				break;
			}
		}
        if (typeof mapping === "string" && sortable) {
            me.store.sort(mapping);
            el.set({
                sort : me.store.sortToggle[mapping]
            });
        }
    },

    buildDataView : function() {
        var me        = this,
            colModel  = me.colModel,
            colNum    = me.getColNum(false),
            width     = me.width,
            //_cellWidth = width/colNum || 250,
			viewInfoHtml = ' pagecid=' + me.pagecid +' simbapageid='+ me.simbapageid + ' reportid=' + me.reportid + ' viewname="' + me.viewname + '" ',
            colTpl   = rowAggTpl = '<tr class="x-grid-row {isDirty:this.isRowDirty(parent)}">';
		colIndex = 1;
        for (var i = 0; i < colModel.length; i++) {
            var col   = colModel[i],
                cellWidth = col.width || 250,
                style = (i === colModel.length - 1) ? "padding-right: 10px;" : "",
				drillThrough = "",
                cls   = col.cls || "";

            style += col.style || "text-align: center;";
			rowAggStyle = style;
			
			if (col.drillThrough && ! _offline) {
				style += "text-decoration: underline;  color: #CCFFFF;";
				drillThrough += ' onclick="javascript: SimbaApp.drillThrough(this);" ';
				drillThrough += ' drillThroughCid="'+ col.drillThrough +'" ';
			}

            if (col.hidden) {
                cls += "x-grid-col-hidden";
            }
			colIndex = colIndex + i;
			// if (typeof col.renderer === "function") {
			if(col.dataFormat){
				var rendermapping = col.mapping + '_render';
				colTpl += '<td colIndex=' + colIndex +' height="30" ' + drillThrough + viewInfoHtml + ' width="' + cellWidth + 'px" class="x-grid-cell x-grid-col-' + col.mapping + ' ' + cls + ' {isDirty:this.isCellDirty(parent)}" style="' + style + '" mapping="' + col.mapping + '" rowIndex="{rowIndex}">{' + rendermapping + '}</td>';
				rowAggTpl += '<td colIndex=' + colIndex +' height="30" ' + viewInfoHtml + ' width="' + cellWidth + 'px" class="x-grid-cell x-grid-col-' + col.mapping + ' ' + cls + ' {isDirty:this.isCellDirty(parent)}" style="' + rowAggStyle + '" mapping="' + col.mapping + '" rowIndex="{rowIndex}">{' + rendermapping + '}</td>';
				colIndex = colIndex + 1;
			} else {
				colTpl += '<td colIndex=' + colIndex +' height="30" ' + drillThrough + viewInfoHtml + ' width="' + cellWidth + 'px" class="x-grid-cell x-grid-col-' + col.mapping + ' ' + cls + ' {isDirty:this.isCellDirty(parent)}" style="' + style + '" mapping="' + col.mapping + '" rowIndex="{rowIndex}">{' + col.mapping + '}</td>';
				rowAggTpl += '<td colIndex=' + colIndex +' height="30" ' + viewInfoHtml + ' width="' + cellWidth + 'px" class="x-grid-cell x-grid-col-' + col.mapping + ' ' + cls + ' {isDirty:this.isCellDirty(parent)}" style="' + rowAggStyle + '" mapping="' + col.mapping + '" rowIndex="{rowIndex}">{' + col.mapping + '}</td>';
			}
        }
        colTpl += '</tr>';
		rowAggTpl += '</tr>';

		return {
            store        : me.store,
            itemSelector : "tr.x-grid-row",
            simpleSelect : me.multiSelect,
            allowDeselect: false,
			// scroll       : (Ext.is.Phone) ? 'both' : me.contentScroll,
			scroll       : me.contentScroll,
            tpl          : new Ext.XTemplate(
                '<table width="' + width + 'px">',
                    '<tpl for=".">',
						'<tpl if="rowAgg == false">',
							colTpl,
						'</tpl>',
						'<tpl if="rowAgg == true">',
							rowAggTpl,
						'</tpl>',
                    '</tpl>',
                '</table>',
                {
                    isRowDirty: function(dirty, data) {
                        return dirty ? "x-grid-row-dirty" : "";
                    },
                    isCellDirty: function(dirty, data) {
                        return dirty ? "x-grid-cell-dirty" : "";
                    }
                }
            ),
            prepareData  : function(data, index, record) {
                var column,
                    i  = 0,
                    ln = colModel.length;

                data.dirtyFields = {};

                for (; i < ln; i++) {
                    column = colModel[i];
                    // if (typeof column.renderer === "function") {
                        // data[column.mapping] = column.renderer.apply(me, [data[column.mapping]]);
						// data[column.mapping+'_render'] = column.renderer.apply(me, [data[column.mapping]]);
                    // }
					if(column.dataFormat){
						data[column.mapping+'_render'] = me.renderValue(column.dataFormat, data[column.mapping]);
						// console.log('dataFormat',column.dataFormat);
					} else {
						data[column.mapping] = me.renderValue(false, data[column.mapping]);
					}
                }

                data.isDirty = record.dirty;

                data.rowIndex = index;

                return data;
            },
            bubbleEvents : [
                "beforeselect",
                "containertap",
                "itemdoubletap",
                "itemswipe",
                "itemtap",
                "selectionchange"
            ]
        };
    },
	
	isNumber: function (n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	},
	
	renderValue: function(dataFormat,v){
		// console.log(v,dataFormat);
		var me = this;
		if(v === '' || v === undefined) return v;
		// if(parseFloat(v)) v = parseFloat(v);
		if(this.isNumber(v)) v = parseFloat(v);
		else return v;
		if(dataFormat == false){
			if(Ext.isNumber(v)){
				v = v.toFixed(2);
			}
			return v;
		}
		var maxDigits = dataFormat.maxDigits ? parseInt(dataFormat.maxDigits) : 0;
		if(Ext.isNumber(v)) v = v.toFixed(maxDigits);
		if(dataFormat.commas === 'true') v = me.addCommas(v);
		if(dataFormat.type === 'saw:currency') v = me.renderMoney(v);
		if(dataFormat.type === 'saw:percent') v = me.renderPercentage(v);
		return v;
	},
	
	renderMoney: function (v){
		v = v + '';
		if (v.slice(0, 1) == '-') return '-$' + v.substr(1);
		else return '$' + v;
	},
	
	renderPercentage: function (v){
		return v + '%';
	},
	
	addCommas: function (nStr){
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
	}, 

    // hidden = true to count all columns
    getColNum     : function(hidden) {
        var me       = this,
            colModel = me.colModel,
            colNum   = 0;

        for (var i = 0; i < colModel.length; i++) {
            var col = colModel[i];
            if (!hidden && typeof col.header !== "string") { continue; }
            if (!col.hidden) {
                colNum += col.flex || 1;
            }
        }

        return colNum;
    },

    getMappings: function() {
        var me       = this,
            mappings = {},
            colModel = me.colModel;

        for (var i = 0; i < colModel.length; i++) {
            mappings[colModel[i].mapping] = i
        }

        return mappings;
    },

    toggleColumn: function(index) {
        var me = this;

        if (typeof index === "string") {
            var mappings = me.getMappings();
            index = mappings[index];
        }
        var el      = me.getEl(),
            mapping = me.colModel[index].mapping,
            cells   = el.query("td.x-grid-col-"+mapping);

        for (var c = 0; c < cells.length; c++) {
            var cellEl = Ext.get(cells[c]);
            if (cellEl.hasCls("x-grid-col-hidden")) {
                cellEl.removeCls("x-grid-col-hidden");
                this.colModel[index].hidden = false;
            } else {
                cellEl.addCls("x-grid-col-hidden");
                this.colModel[index].hidden = true;
            }
        }

        me.updateWidths();
    },

    updateWidths: function() {
        var me          = this,
            el          = me.getEl(),
            headerWidth = me.header.getEl().getWidth(),
            colModel    = me.colModel,
            cells       = el.query("td.x-grid-cell"),
            colNum      = me.getColNum(false),
            cellWidth   = 100 / colNum,
            mappings    = me.getMappings();

        for (var c = 0; c < cells.length; c++) {
            var cellEl  = Ext.get(cells[c]),
                mapping = cellEl.getAttribute("mapping"),
                col     = colModel[mappings[mapping]],
                flex    = col.flex || 1,
                width   = flex * cellWidth / 100 * headerWidth;

            cellEl.setWidth(width);
        }
    },

    scrollToRow: function(index) {
        var me       = this,
            el       = me.getEl(),
            rows     = el.query("tr.x-grid-row"),
            rowEl    = Ext.get(rows[index]),
            scroller = me.dataview.scroller;

        var pos = {
            x: 0,
            y: rowEl.dom.offsetTop
        };

        scroller.scrollTo(pos, true);
    },

    getView: function() {
        var me = this;

        return me.dataview;
    },

    bindStore: function(store) {
        var me   = this,
            view = me.getView();

        view.bindStore(store);
    },

    getStore: function() {
        var me   = this,
            view = me.getView();

        return view.getStore();
    },

    getRow: function(index) {
        var me = this;
        if (typeof index === "object") {
            var store = me.getStore(),
                index = store.indexOf(index);
        }

        var el   = me.getEl(),
            rows = el.query("tr");

        return rows[index+1];
    },
    
    getColModel: function(){
    	var me = this;
    	return me.colModel;
    },
    
    updateColModel: function(colModel){
    	var me = this;
    	me.colModel = colModel;
    	me.dataview = new Ext.DataView(me.buildDataView());
        me.items = [me.dataview];
    	//me.initComponent();
    	//me.header = new Ext.Component(me.buildHeader());
//    	console.log(me);
    }
});

Ext.reg("factgridpanel", Ext.ux.FactGridPanel);
