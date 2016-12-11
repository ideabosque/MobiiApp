/*
 * Because of limitation of the current WebKit implementation of CSS3 column layout,
 * I have decided to revert back to using table.
 */

Ext.ns("Ext.ux");

Ext.ux.DimGridPanel = Ext.extend(Ext.Panel, {
    layout        : "fit",

    multiSelect   : false,
    scroll        : (this.scroll !== 'undefined') ? this.scroll : "vertical",
    contentScroll : (this.contentScroll !== 'undefined') ? this.contentScroll : "vertical",
	
	columnLayer  : this.columnLayer || 1,

    initComponent : function() {
        var me = this;
        
        me.width = me.calcWidth();

        me.items = me.dataview = me.buildDataView();

        if (!Ext.isArray(me.dockedItems)) {
            me.dockedItems = [];
        }

        me.header = new Ext.Component(me.buildHeader());
        me.dockedItems.push(me.header);

        Ext.ux.DimGridPanel.superclass.initComponent.call(me);

        var store = me.store;

        store.on("update", me.dispatchDataChanged, me);
    },

    dispatchDataChanged: function(store, rec, operation) {
        var me = this;

        me.fireEvent("storeupdate", store, rec, operation);
    },
    
    calcWidth : function(){
    	var me = this,
    		colModel  = me.colModel,
            colNum    = me.getColNum(false),
            width = 0;
        for (var i = 0; i < colModel.length; i++) {
        	var col  = colModel[i],
				cellWidth = colModel[i].width || 100;
			width += cellWidth;
        }
        return width;
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
			for (var i = 0; i < colModel.length; i++) {
				var col  = colModel[i],
					cellWidth = col.width || 100,
					header = Ext.isArray(col.header) ? col.header[cl] : col.header,
					cls  = "";
				if (col.hidden) cls += "x-grid-col-hidden";
	
				trTpl += '<td style="text-align: left;" height="30" width="' + cellWidth + 'px" class="x-grid-cell x-grid-hd-cell x-grid-col-' + col.mapping + ' ' + cls + '" mapping="' + col.mapping + '">' + header + '</td>';
			}
			trTpl += '</tr>';
			colTpl += trTpl;
		}
		
		colTpl += '</table>';
		
		// console.log('colTpl',colTpl);

        return {
            dock      : "top",
            html      : colTpl,
            listeners : {
                scope       : me,
                afterrender : me.initHeaderEvents
            }
        };
    },
    
    buildHeaderHTML   : function() {
        var me        = this,
            colModel  = me.colModel,
            colNum    = me.getColNum(false),
//            cellWidth = 100/colNum,
//            colTpl    = '<table class="x-grid-header" width="100%">';
            width     = me.width,
            //_cellWidth = width/colNum || 100,
            colTpl    = '<table class="x-grid-header" width="'+ width +'px">';

        colTpl += '    <tr>';
        for (var i = 0; i < colModel.length; i++) {
            var col  = colModel[i],
            	cellWidth = col.width || 100,
//                flex = col.flex || 1,
                cls  = "";

//            var width = flex * cellWidth;

            if (col.hidden) {
                cls += "x-grid-col-hidden";
            }

            colTpl += '<td width="' + cellWidth + 'px" class="x-grid-cell x-grid-hd-cell x-grid-col-' + col.mapping + ' ' + cls + '" mapping="' + col.mapping + '">' + col.header + '</td>';
        }
        colTpl += '    </tr>';
        colTpl += '</table>';

        return colTpl;
    },

    initHeaderEvents: function(cmp) {
        var me = this,
            el = cmp.getEl();

        el.on("click", me.handleHeaderClick, me);
    },

    handleHeaderClick: function(e, t) {
        e.stopEvent();

        var me      = this,
        	colModel  = me.colModel,
            el      = Ext.get(t),
            mapping = el.getAttribute("mapping");
            
		for (var i = 0; i < colModel.length; i++) {
			var col   = colModel[i];
			if(col.mapping === mapping) {
				var sortable = col.sortable || false;
				var sortby = col.sortby || mapping; 
				break;
			}
		}

        if (typeof mapping === "string" && sortable) {
            me.store.sort(sortby);
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
			viewInfoHtml = ' pagecid=' + me.pagecid +' simbapageid='+ me.simbapageid + ' reportid=' + me.reportid + ' viewname="' + me.viewname + '" ',
            colTpl    = '<tr class="x-grid-row {isDirty:this.isRowDirty(parent)}">';
//            cellWidth = 100/colNum;

        for (var i = 0; i < colModel.length; i++) {
            var col   = colModel[i],
//                flex  = col.flex || 1,
//                width = flex * cellWidth,
                cellWidth = col.width || 100,
                style = (i === colModel.length - 1) ? "padding-right: 10px;" : "",
				drillThrough = "",
                cls   = col.cls || "";

            style += col.style || "";
			if (col.drillThrough && ! _offline) {
				style += "text-decoration: underline;  color: #CCFFFF;";
				drillThrough += ' onclick="javascript: SimbaApp.drillThrough(this);" ';
				drillThrough += ' drillThroughCid="'+ col.drillThrough +'" ';
			}

            if (col.hidden) {
                cls += "x-grid-col-hidden";
            }

            colTpl += '<td height="30" ' + drillThrough + viewInfoHtml + ' width="' + cellWidth + 'px" class="x-grid-cell x-grid-col-' + col.mapping + ' ' + cls + ' {isDirty:this.isCellDirty(parent)}" style="' + style + '" mapping="' + col.mapping + '" rowIndex="{rowIndex}">{' + col.mapping + '}</td>';
        }
        colTpl += '</tr>';

        return new Ext.DataView({
            store        : me.store,
            itemSelector : "tr.x-grid-row",
            simpleSelect : me.multiSelect,
            allowDeselect: false,
            scroll       : (Ext.is.Phone) ? me.scroll : me.contentScroll,
            tpl          : new Ext.XTemplate(
                '<table style="width: 100%;">',
                    '<tpl for=".">',
                        colTpl,
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
                    if (typeof column.renderer === "function") {
                        data[column.mapping] = column.renderer.apply(me, [data[column.mapping]]);
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
            ],
			// listeners: {
				// scope: me,
				// afterrender: me.onTableRendered
			// }
        });
    },
/*
	onTableRendered: function(cmp){
		var me = this,
            el = cmp.getEl();
		console.log('me', me);
		console.log('el', el);
		var tableEl = el.down('table');
		console.log('tableEl',tableEl);
		if(tableEl){
			var tableObj = tableEl.dom;
			var rowsLen = tableObj.rows.length;
			var colsLen = tableObj.rows[0].cells.length;
			var i, j, k, l;
			for (i = 0; i < colsLen; i ++ ){
				console.log('column:', i);
				for (j = 0; j < rowsLen; j ++){
					console.log('row:', j);
					var rowObj = tableObj.rows[j];
					var rowSpan = 1;
					var strTemp = rowObj.cells[i].innerText;
					// console.log('strTemp',strTemp);
					for (k = j + 1; k < rowsLen; k ++){
						// console.log('strTemp----',strTemp);
						if(strTemp == tableObj.rows[k].cells[i].innerText){
							rowSpan ++;
							tableObj.rows[j].cells[i].rowspan = rowSpan;
							// tableObj.rows[k].cells[i].innerText = "";
							// tableObj.rows[k].cells[i].style.display = "none";
							if(colsLen == 1) tableObj.rows[k].style.display = "none";
							else tableObj.rows[k].cells[i].style.display = "none";
						} else {
							break;
						}
					}
					j = k -1;
				}
			}
		}
	},
*/
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
    	var headerHTML = me.buildHeaderHTML();
    	me.dockedItems.last().update(headerHTML);
    	//me.initComponent();
    	//me.header = new Ext.Component(me.buildHeader());
//    	console.log(me);
    }
});

Ext.reg("dimgridpanel", Ext.ux.DimGridPanel);