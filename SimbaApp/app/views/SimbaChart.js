Ext.chart.Chart.override({
    destroy: function() {
        Ext.iterate(this.surfaces, function(name, surface) {
            surface.setSize(0, 0);
            surface.destroy();
        });
        this.bindStore(null);
        if (this.legend) {
            if (this.legend.dock) {
                this.legend.sheet.destroy();
            }
            this.legend.view.destroy();
        }
        ;
        if (this.getToolbar())
            this.getToolbar().destroy();
        if (this.interactions) {
            if (this.interactions.items.length > 0) {
                Ext.each(this.interactions.items, function(item, index, allItems) {
                    if (item.infoPanel)
                        item.infoPanel.destroy();
                });
            }
        }
        Ext.chart.Chart.superclass.destroy.apply(this, arguments);
    }
});
Ext.chart.series.Area.override({
    isItemInPoint: function(x, y, item, i) {
        var me = this, 
        pointsUp = item.pointsUp, 
        pointsDown = item.pointsDown, 
        abs = Math.abs, 
        dist = Infinity, p, pln, point, k;
        
        for (p = 0, pln = pointsUp.length; p <= pln; p++) {
            if (p == pln) {
                point = [pointsUp[p - 1][0], pointsUp[p - 1][1]];
            } else {
                point = [pointsUp[p][0], pointsUp[p][1]];
            }
            if (dist > abs(x - point[0])) {
                dist = abs(x - point[0]);
            } else {
                point = pointsUp[p - 1];
                if (y >= point[1] && (!pointsDown.length || y <= (pointsDown[p - 1][1]))) {
                    item.storeIndex = p - 1;
                    item.storeField = me.yField[i];
                    item.storeItem = me.chart.store.getAt(p - 1);
                    item._points = pointsDown.length ? [point, pointsDown[p - 1]] : [point];
                    return true;
                } else {
                    break;
                }
            }
        }
        return false;
    }
});
Ext.chart.axis.Category.override({
    applyData: function() {
        Ext.chart.axis.Category.superclass.applyData.call(this);
        this.setLabels();
        var count = this.chart.store.getCount();
        if (count == 1) {
            return {
                from: 0,
                to: 1,
                power: 1,
                step: 1,
                steps: 1
            };
        } else {
            return {
                from: 0,
                to: count - 1,
                power: 1,
                step: 1,
                steps: count - 1
            };
        }
    }
});

Ext.chart.axis.Gauge.override({
    drawLabel: function() {
        var me = this, 
        chart = me.chart, 
        surface = me.getSurface(), 
        bbox = chart.chartBBox, 
        centerX = bbox.x + (bbox.width / 2), 
        centerY = bbox.y + bbox.height, 
        margin = me.margin || 10, 
        rho = Math.min(bbox.width, 2 * bbox.height) / 2 + 2 * margin, 
        round = Math.round, 
        labelArray = [], label, 
        maxValue = me.maximum || 0, 
        minValue = me.minimum || 0, 
        steps = me.steps, i = 0, 
        adjY, 
        pi = Math.PI, 
        cos = Math.cos, 
        sin = Math.sin, 
        labelConf = me.labelStyle.style, 
        renderer = labelConf.renderer || function(v) {
            return v;
        };
        
        if (!me.labelArray) {
            //draw scale
            for (i = 0; i <= steps; i++) {
                // TODO Adjust for height of text / 2 instead
                adjY = (i === 0 || i === steps) ? 7 : 0;
                label = surface.add({
                    type: 'text',
                    //   text: renderer(round(i / steps * maxValue)),
                    text: renderer(round(i / steps * (maxValue - minValue)) + minValue),
                    x: centerX + rho * cos(i / steps * pi - pi),
                    y: centerY + rho * sin(i / steps * pi - pi) - adjY,
                    'text-anchor': 'middle',
                    'stroke-width': 0.2,
                    zIndex: 10,
                    stroke: '#333'
                });
                label.setAttributes(Ext.apply(me.labelStyle.style || {}, {
                    hidden: false
                }), true);
                labelArray.push(label);
            }
        } 
        else {
            labelArray = me.labelArray;
            //draw values
            for (i = 0; i <= steps; i++) {
                // TODO Adjust for height of text / 2 instead
                adjY = (i === 0 || i === steps) ? 7 : 0;
                labelArray[i].setAttributes({
                    //   text: renderer(round(i / steps * maxValue)),
                    text: renderer(round(i / steps * (maxValue - minValue)) + minValue),
                    x: centerX + rho * cos(i / steps * pi - pi),
                    y: centerY + rho * sin(i / steps * pi - pi) - adjY
                }, true);
            }
        }
        me.labelArray = labelArray;
    }
});

SimbaApp.views.SimbaChart = Ext.extend(Ext.Panel, {
    layout: 'fit',
    initComponent: function() {
        var me = this;
        me.dockedItems = me.dockedItems || [];
        //	me.store = me.store || me.buildStoreFromColumnInfo();
        
        me.store2 = me.buildStoreFromColumnInfo2();
        me.store = me.buildStore();
		
        me.category1 = [];
        me.category1v = [];
        if (me.categories.length == 0) {
        } else {
            for (key in me.categories) {
                me.category1.push(key);
                if (me.categories[key] != "''") {
                    me.category1v.push(me.simbaview.viewInfo.columnInfo[key].columnHeading);
                } else {
                    me.category1v.push("");
                }
            }
        }
        me.serie1 = [];
        me.serie1v = [];
        if (me.series.length == 0) {
        } else {
            for (key in me.series) {
                me.serie1.push(key);
                if (me.series[key] != "''") {
                    me.serie1v.push(me.simbaview.viewInfo.columnInfo[key].columnHeading);
                } else {
                    me.serie1v.push("");
                }
            }
        }
        me.measure1 = [];
        me.measure1v = [];
        me.measure1t = {};
        if (me.measures.length == 0) {
        } else {
            for (key in me.measures) {
                me.measure1.push(key);
                me.measure1t = me.simbaview.viewInfo.columnInfo[key].dataFormat;
                if (me.measures[key] != "''") {
                    me.measure1v.push(me.simbaview.viewInfo.columnInfo[key].columnHeading);
                } else {
                    me.measure1v.push("");
                }
            }
        }
        me.category = [];
        me.categoryv = [];
        me.measure = [];
        me.measurev = [];
        me.serie = [];
        me.seriev = [];
        
        if (me.store.data.items.length > 0) {
            for (key in me.store.data.items[0].data) {
                if (key == me.serie1.join(',')) {
                    me.serie.push(key);
                    me.seriev.push(me.serie1v.join(','));
                } else if (key == me.serie1.reverse().join(',')) {
                    me.serie.push(key);
                    me.seriev.push(me.serie1v.reverse().join(','));
                } else if (key == me.category1.join(',')) {
                    me.category.push(key);
                    me.categoryv.push(me.category1v.join(','));
                } else if (key == me.category1.reverse().join(',')) {
                    me.category.push(key);
                    me.categoryv.push(me.category1v.reverse().join(','));
                } else {
                    if (key.indexOf("function") == -1) 
                    {
                        me.measure.push(key);
                        if (me.measures[key] == undefined) {
                            me.measurev.push(key);
                        } else {
                            me.measurev.push(me.simbaview.viewInfo.columnInfo[key].columnHeading);
                        }
                    } else {
                    }
                }
            }
        } else {
        }
        
        var len = me.store.data.length;
        var datalen = 0;
        var pos = 0;
        var neg = 0;
        var isnum = 0;
        var unum = 0;
        for (var i = 0; i < len; i++) {
            for (var j in me.store.data.items[0].data) {
                //   if(typeof(me.store.data.items[i].data[j])=='number'){
                datalen += 1;
                var reg = /^-|\d*\.?\d+$/;
                if (reg.test(me.store.data.items[i].data[j]) && j != me.category[0]) {
                    isnum = isnum + 1;
                    if (parseFloat(me.store.data.items[i].data[j]) < 0) {
                        neg = neg + 1;
                    } else {
                        pos = pos + 1;
                    }
                } else {
                    unum = unum + 1;
                }
            }
        }
        
        if (me.simbaview.viewInfo.type == 'pie') {
            if (me.measurev.length > 1) {
                var results = [];
                var fields = ['name', 'value', 'seriev'];
                for (var i = 0; i < me.store.data.items.length; i++) {
                    for (var j = 0; j < me.measure.length; j++) {
                        var data = me.store.data.items[i].data;
                        var result = {};
                        result['seriev'] = data[me.serie];
                        result['name'] = data[me.serie] + ',' + me.measurev[j];
                        result['value'] = data[me.measure[j]];
                        results.push(result);
                    }
                }
                var store = new Ext.data.JsonStore({
                    fields: fields,
                    data: results
                });
                
                var chart = new Ext.chart.Chart({
                    cls: 'pie1',
                    theme: 'Demo',
                    shadow: false,
                    insetPadding: 20,
                    store: store,
                    animate: Ext.is.Blackberry ? false : true,
                    legend: {
                        position: {
                            portrait: 'left',
                            landscape: 'left'
                        },
                        dock: Ext.is.Phone ? true : false
                    },
                    interactions: [{type: 'rotate'}, 
                        {
                            type: 'piegrouping',
                            onSelectionChange: function(me, items) {
                                //	var cmp = Ext.getCmp(myid2);
                                //	var cmp1 = Ext.getCmp(myid1);
                                var cmp = Ext.getCmp(myid);
                                cmp.addCls('mpc');
                                
                                if (items.length > 1) {
                                    var sum = 0, 
                                    i = items.length;
                                    while (i--) {
                                        sum += items[i].storeItem.get('value');
                                    }
                                    cmp.update(['Total: ' + sum, '<div class="myanchor"></div>'].join(''));
                                //cmp1.hide();
                                } /*else{
                            cmp1.show();
							cmp.update('');
						}*/
                            }
                        }],
                    series: [{
                            type: 'pie',
                            colorSet: ["#115fa6", "#94ae0a", "#a61120", "#ff8809", "#ffd13e", "#a61187", "#24ad9a", 
                                "#7c7474", "#a66111", "#f08080", "#8b00bb", "#1e90ff", "#ff69b4", "#ffd4ff", "#7fff7f", 
                                "#7b68ee", "#ff0000", "#ffff00", "#008000", "#0000ff", "#bc8f8f", "#d4d4ff"],
                            field: 'value',
                            showInLegend: true,
                            highlight: {
                                segment: {
                                    margin: 20
                                }
                            },
                            listeners: {
                                'itemtap': function(series, item, event) {
                                    var a1 = item.endAngle;
                                    var a2 = item.startAngle;
                                    var a3 = item.startAngle - item.endAngle;
                                    var a4 = a3 / 2;
                                    var astart = 270 + a4;
                                    var aend = 270 - a4;
                                    angle = aend - a1;
                                    
                                    var rotation = (rotation || 0) + angle;
                                    matrix = series.getFastTransformMatrix();
                                    matrix.rotate(angle, series.centerX, series.centerY);
                                    series.setFastTransformMatrix(matrix);
                                    
                                    series.rotation -= rotation;
                                    series.drawSeries();
                                    series.getSurface().renderFrame();
                                    series.clearTransform();
                                    rotation = 0;
                                    var storeItem = item.storeItem;
                                    //var cmp = Ext.getCmp(myid1);
                                    var cmp = Ext.getCmp(myid);
                                    cmp.addCls('mpc');
                                    
                                    var num = storeItem.get('value');
                                    num = me.renderValue(me.measure1t, num);
                                    var temp = storeItem.get('name').split(",");
                                    var drillThroughCid = (me.simbaview.viewInfo.navigate && !_offline) ? me.simbaview.viewInfo.navigate.cid : 0;
                                    if (drillThroughCid) {
                                        var drillThroughcaption = me.simbaview.viewInfo.navigate.caption;
                                        if (Ext.is.Phone) {
                                            // var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" serieValue="' + storeItem.get('seriev') + '" serieMapping="' + me.serie + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                            var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" serieValue="' + storeItem.get('seriev') + '" serieMapping="' + me.serie + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                            cmp.update([temp[0] + ': ' + num + ' (' + temp[1] + ') ', drillThroughHTML, '<div class="myanchor"></div>'].join(''));
                                        } else {
                                            // var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" serieValue="' + storeItem.get('seriev') + '" serieMapping="' + me.serie + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                            var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" serieValue="' + storeItem.get('seriev') + '" serieMapping="' + me.serie + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                            cmp.update(['<ul><li>' + me.seriev + ': ' + temp[0] + '</li>', '<li>' + temp[1] + ': ' + num + '</li>', drillThroughHTML, '</ul>', '<div class="myanchor"></div>'].join(''));
                                        }
                                    } else {
                                        if (Ext.is.Phone) {
                                            cmp.update([temp[0] + ': ' + num + ' (' + temp[1] + ') ', '<div class="myanchor"></div>'].join(''));
                                        } else {
                                            cmp.update(['<ul><li>' + me.seriev + ': ' + temp[0] + '</li>', '<li>' + temp[1] + ': ' + num + '</b></li></ul>', '<div class="myanchor"></div>'].join(''));
                                        }
                                    }
                                }
                            },
                            label: {
                                field: 'name',
                                renderer: function(v) {
                                    if (v === undefined) {
                                    } 
                                    else if (v.length > 15) {
                                        return v.substr(0, 13) + '..';
                                    } else {
                                        return v;
                                    }
                                }
                            }
                        }]
                });
                //  var myid1 = 'mp1'+'-'+me.pagecid+'-'+me.reportid+'-'+me.simbaview.viewName;
                //  var myid2 = 'mp2'+'-'+me.pagecid+'-'+me.reportid+'-'+me.simbaview.viewName;
                var myid = 'mp' + '-' + me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
                
                me.items = [{
                        xtype: 'panel',
                        layout: {
                            type: 'vbox',
                            align: 'stretch',
                            pack: 'center'
                        },
                        items: [{
                                xtype: 'panel',
                                flex: 2,
                                layout: {
                                    type: 'vbox',
                                    align: 'center',
                                    pack: 'center'
                                },
                                items: [{
                                        xtype: 'panel',
                                        id: myid
                                    }]
                            }, {
                                xtype: 'panel',
                                flex: 10,
                                layout: 'fit',
                                items: [chart]
                            }]
                    }];
            
            } else {
                var myfield = me.measure[0];
                var chart = new Ext.chart.Chart({
                    cls: 'pie1',
                    theme: 'Demo',
                    shadow: false,
                    insetPadding: 20,
                    store: me.store,
                    animate: Ext.is.Blackberry ? false : true,
                    legend: {
                        position: {
                            portrait: 'left',
                            landscape: 'left'
                        },
                        dock: Ext.is.Phone ? true : false
                    },
                    interactions: [{type: 'rotate'}, 
                        {
                            type: 'piegrouping',
                            onSelectionChange: function(me, items) {
                                //	var cmp = Ext.getCmp(myid2);
                                //	var cmp1 = Ext.getCmp(myid1);
                                var cmp = Ext.getCmp(myid);
                                cmp.addCls('mpc');
                                
                                if (items.length > 1) {
                                    var sum = 0, 
                                    i = items.length;
                                    while (i--) {
                                        sum += items[i].storeItem.get(myfield);
                                    }
                                    cmp.update(['Total: ' + sum, '<div class="myanchor"></div>'].join(''));
                                //cmp1.hide();
                                } /*else{
                            cmp1.show();
							cmp.update('');
						}*/
                            }
                        }],
                    series: [{
                            type: 'pie',
                            colorSet: ["#115fa6", "#94ae0a", "#a61120", "#ff8809", "#ffd13e", "#a61187", "#24ad9a", 
                                "#7c7474", "#a66111", "#f08080", "#8b00bb", "#1e90ff", "#ff69b4", "#ffd4ff", "#7fff7f", 
                                "#7b68ee", "#ff0000", "#ffff00", "#008000", "#0000ff", "#bc8f8f", "#d4d4ff"],
                            field: me.measure[0],
                            showInLegend: true,
                            highlight: {
                                segment: {
                                    margin: 20
                                }
                            },
                            listeners: {
                                'itemtap': function(series, item, event) {
                                    var a1 = item.endAngle;
                                    var a2 = item.startAngle;
                                    var a3 = item.startAngle - item.endAngle;
                                    var a4 = a3 / 2;
                                    var astart = 270 + a4;
                                    var aend = 270 - a4;
                                    angle = aend - a1;
                                    
                                    var rotation = (rotation || 0) + angle;
                                    matrix = series.getFastTransformMatrix();
                                    matrix.rotate(angle, series.centerX, series.centerY);
                                    series.setFastTransformMatrix(matrix);
                                    
                                    series.rotation -= rotation;
                                    series.drawSeries();
                                    series.getSurface().renderFrame();
                                    series.clearTransform();
                                    rotation = 0;
                                    
                                    
                                    var storeItem = item.storeItem;
                                    //	 var cmp = Ext.getCmp(myid1);
                                    var cmp = Ext.getCmp(myid);
                                    cmp.addCls('mpc');
                                    
                                    var num = storeItem.get(me.measure[0]);
                                    num = me.renderValue(me.measure1t, num);
                                    
                                    var drillThroughCid = (me.simbaview.viewInfo.navigate && !_offline) ? me.simbaview.viewInfo.navigate.cid : 0;
                                    if (drillThroughCid) {
                                        var drillThroughcaption = me.simbaview.viewInfo.navigate.caption;
                                        if (Ext.is.Phone) {
                                            // var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" serieValue="' + storeItem.get(me.serie) + '" serieMapping="' + me.serie + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                            var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" serieValue="' + storeItem.get(me.serie) + '" serieMapping="' + me.serie + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                            cmp.update([storeItem.get(me.serie) + ': ' + num + ' (' + me.measurev + ') ', drillThroughHTML, '<div class="myanchor"></div>'].join(''));
                                        } else {
                                            // var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" serieValue="' + storeItem.get(me.serie) + '" serieMapping="' + me.serie + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                            var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" serieValue="' + storeItem.get(me.serie) + '" serieMapping="' + me.serie + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                            cmp.update(['<ul><li>' + me.seriev + ': ' + storeItem.get(me.serie) + '</li>', '<li>' + me.measurev + ': ' + num + '</li>', drillThroughHTML, '</ul>', '<div class="myanchor"></div>'].join(''));
                                        }
                                    } else {
                                        if (Ext.is.Phone) {
                                            cmp.update([storeItem.get(me.serie) + ': ' + num + ' (' + me.measurev + ') ', '<div class="myanchor"></div>'].join(''));
                                        } else {
                                            cmp.update(['<ul><li>' + me.seriev + ': ' + storeItem.get(me.serie) + '</li>', '<li>' + me.measurev + ': ' + num + '</li></ul>', '<div class="myanchor"></div>'].join(''));
                                        }
                                    }
                                }
                            },
                            label: {
                                field: me.serie[0],
                                renderer: function(v) {
                                    if (v === undefined) {
                                    } 
                                    else if (v.length > 15) {
                                        return v.substr(0, 13) + '..';
                                    } else {
                                        return v;
                                    }
                                }
                            }
                        }]
                });
                // var myid1 = 'mp1'+'-'+me.pagecid+'-'+me.reportid+'-'+me.simbaview.viewName;
                // var myid2 = 'mp2'+'-'+me.pagecid+'-'+me.reportid+'-'+me.simbaview.viewName;
                var myid = 'mp' + '-' + me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
                
                me.items = [{
                        xtype: 'panel',
                        layout: {
                            type: 'vbox',
                            align: 'stretch',
                            pack: 'center'
                        },
                        items: [{
                                xtype: 'panel',
                                flex: 2,
                                layout: {
                                    type: 'vbox',
                                    align: 'center',
                                    pack: 'center'
                                },
                                items: [{
                                        xtype: 'panel',
                                        id: myid
                                    }]
                            }, {
                                xtype: 'panel',
                                flex: 10,
                                layout: 'fit',
                                items: [chart]
                            }]
                    }];
            }
        } else if (me.simbaview.viewInfo.type == 'bar') {
            var titley = '';
            if (me.category1v.length > 1) {
                titley = 'Categories';
            } else {
                titley = me.category1v[0];
            }
            var fstack = false;
            if (me.simbaview.viewInfo.subType.indexOf('stacked') != -1) {
                fstack = true;
            }
            var faxes = [{
                    type: 'Numeric',
                    position: 'bottom',
                    fields: me.measure,
                    title: me.measure1v.join(','),
                    grid: true,
                    label: {
                        fill: '#fff',
                        renderer: function(v) {
                            return me.renderValue(me.measure1t, v);
                        }
                    },
                    labelTitle: {
                        fill: '#fff'
                    },
                    grid: {
                        opacity: 1,
                        fill: '#000',
                        stroke: '#bbb',
                        'stroke-width': 1
                    }
                }, {
                    type: 'Category',
                    position: 'left',
                    fields: me.category,
                    title: titley,
                    label: {
                        fill: '#fff',
                        renderer: function(v) {
                            if (v === undefined) {
                            } 
                            else if (v.length > 5) {
                                return v.substr(0, 3) + '..';
                            } else {
                                return v;
                            }
                        }
                    },
                    labelTitle: {
                        fill: '#fff'
                    },
                    grid: false
                }];
            
            if (pos == 0 && neg > 0) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].maximum = 0;
                    }
                }
            } else if (pos > 0 && neg == 0) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].minimum = 0;
                    }
                }
            } else if (unum == datalen) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].maximum = 10;
                    }
                }
            } else {
            }
            
            var oldbaritem = [];
            var chart = new Ext.chart.Chart({
                theme: 'Demo',
                cls: 'bar1',
                store: me.store,
                animate: Ext.is.Blackberry ? false : true,
                insetPadding: 20,
                legend: {
                    position: {
                        portrait: 'left',
                        landscape: 'left'
                    },
                    labelFont: '17px Arial',
                    dock: Ext.is.Phone ? true : false
                },
                interactions: [{
                        type: 'togglestacked',
                        gesture: 'pinch'
                    }, {
                        type: 'iteminfo',
                        listeners: {
                            'show': function(ma, item, panel) {
								panel.on('beforehide',function(){
									// console.log('Before Hide Detail panel');
									var maskElement = Ext.DomQuery.selectNode('div.x-mask');
									// console.log('maskElement',maskElement);
									if(maskElement){
										maskElement.parentNode.removeChild(maskElement);
									}
								});
								if(panel.isHidden()) panel.show();
                                var items = item.series.items;
                                var fitems = [];
                                for (var i = 0; i < items.length; i++) {
                                    if (items[i].value[0] == item.value[0]) {
                                        fitems.push(items[i]);
                                    }
                                }
                                if (oldbaritem == undefined) {
                                    for (var j = 0; j < fitems.length; j++) {
                                        fitems[j].series.highlightItem(fitems[j]);
                                        oldbaritem.push(fitems[j]);
                                    }
                                } else {
                                    for (var k = 0; k < oldbaritem.length; k++) {
                                        oldbaritem[k].series.unHighlightItem(oldbaritem[k]);
                                    }
                                    delete oldbaritem;
                                    for (var m = 0; m < fitems.length; m++) {
                                        oldbaritem.push(fitems[m]);
                                        fitems[m].series.highlightItem(fitems[m]);
                                    }
                                }
                                
                                
                                var storeItem = item.storeItem;
                                var drillThroughCid = (me.simbaview.viewInfo.navigate && !_offline) ? me.simbaview.viewInfo.navigate.cid : 0;
                                if (drillThroughCid) {
                                    var drillThroughcaption = me.simbaview.viewInfo.navigate.caption;
                                    // var drillThroughHTML = '<li>Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a></li>';
                                    var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + panel.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                }
                                var dataresult = '';
                                if (me.categories && me.series && me.measures > 0) {
                                    for (key in storeItem.data) {
                                        for (var i = 0; i < me.category.length; i++) {
                                            if (key == me.category[i]) {
                                            }
                                        }
                                        for (var j = 0; j < me.measure.length; j++) {
                                            if (key == me.measure[j]) {
                                                key1 = me.measurev[j];
                                                value1 = storeItem.data[key];
                                                value1 = me.renderValue(me.measure1t, value1);
                                                //if (Ext.is.Phone){
                                                //   dataresult += value1 + ' ('+key1+'), ';
                                                //}else{
                                                dataresult += '<li>' + key1 + ': ' + value1 + '</li>';
                                            //}
                                            }
                                        }
                                    }
                                    if (drillThroughHTML) {
                                        //if (Ext.is.Phone){
                                        //  dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                        //  var drillThroughHTML = 'Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a>';
                                        //  cmp.update(['<div class="oneline">'+ storeItem.get(me.category)+': ' + dataresult + drillThroughHTML + '</div>'].join(''));
                                        //}else{
                                        panel.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, drillThroughHTML, '</ul>'].join(''));
                                    //}
                                    } else {
                                        //if (Ext.is.Phone){
                                        //   dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                        //    cmp.update(['<div class="oneline">'+storeItem.get(me.category)+': ' + dataresult + '</div>'].join(''));
                                        //}else{
                                        panel.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, '</ul>'].join(''));
                                    //}
                                    }
                                } else {
                                    for (key in storeItem.data) {
                                        for (var i = 0; i < me.category.length; i++) {
                                            if (key == me.category[i]) {
                                            }
                                        }
                                        for (var j = 0; j < me.measure.length; j++) {
                                            if (key == me.measure[j]) {
                                                key1 = me.measurev[j];
                                                value1 = storeItem.data[key];
                                                value1 = me.renderValue(me.measure1t, value1);
                                                //if (Ext.is.Phone){
                                                //	dataresult += value1 + ' ('+key1+'), ';
                                                //}else{
                                                dataresult += '<li>' + key1 + ': ' + value1 + '</li>';
                                            //}
                                            }
                                        }
                                    }
                                    if (drillThroughHTML) {
                                        //if (Ext.is.Phone){
                                        //dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                        // var drillThroughHTML = 'Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a>';
                                        // cmp.update(['<div class="oneline">'+storeItem.get(me.category)+': '+ dataresult + drillThroughHTML +'</div>'].join(''));
                                        //}else{
                                        panel.update(['<ul><li>' + me.category1v + ': ' + storeItem.get(me.category) + '</li>', dataresult, drillThroughHTML, '</ul>'].join(''));
                                    //}
                                    } else {
                                        //if (Ext.is.Phone){
                                        //   dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                        //   cmp.update('<div class="oneline">'+[storeItem.get(me.category)+': ' + dataresult+'</div>'].join(''));
                                        //}else{
                                        panel.update(['<ul><li>' + me.category1v + ': ' + storeItem.get(me.category) + '</li>', dataresult, '</ul>'].join(''));
                                    //}
                                    }
                                }
                            }
                        }
                    }],
                
                axes: faxes,
                series: [{
                        stacked: fstack,
                        type: 'bar',
                        highlight: true,
                        axis: 'bottom',
                        /*  listeners: {
                        'itemtap': function(series, item,  event) {
						    var items = series.items;
							var fitems=[];
							for (var i=0;i<items.length;i++){
								if (items[i].value[0]==item.value[0]){
									fitems.push(items[i]);
							    }
							}
							if(oldbaritem==undefined){
								for (var j=0;j<fitems.length;j++){
									fitems[j].series.highlightItem(fitems[j]);
								    oldbaritem.push(fitems[j]);
								}
							}else{
								for (var k=0;k<oldbaritem.length;k++){
									oldbaritem[k].series.unHighlightItem(oldbaritem[k]);
								}
							    delete oldbaritem;
							    for (var m=0;m<fitems.length;m++){
									oldbaritem.push(fitems[m]);
							        fitems[m].series.highlightItem(fitems[m]);
							    }
							}
						//	if(oldbaritem==undefined){
						//		item.series.highlightItem(item);
						//		oldbaritem = item;
						//	}else{
						//    oldbaritem.series.unHighlightItem(oldbaritem);
						//	oldbaritem=item;
						//	item.series.highlightItem(item);
						//	}

							var storeItem = item.storeItem;
							var cmp = Ext.getCmp(myid);
                            var drillThroughCid = (me.simbaview.viewInfo.navigate && ! _offline) ? me.simbaview.viewInfo.navigate.cid : 0;
                            if (drillThroughCid){
                               var drillThroughcaption = me.simbaview.viewInfo.navigate.caption;
                               var drillThroughHTML = '<li>Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a></li>';
						    }
						    var dataresult = '';
                            if (me.categories && me.series && me.measures>0){
								for(key in storeItem.data){
                                  for(var i=0;i<me.category.length;i++){
									if(key==me.category[i]){}
								  }
								  for(var j=0;j<me.measure.length;j++){
									 if(key==me.measure[j]){
											key1= me.measurev[j];
											value1 = storeItem.data[key];
											value1 = me.renderValue(me.measure1t,value1);
											if (Ext.is.Phone){
											   dataresult += value1 + ' ('+key1+'), ';
											}else{
											   dataresult += '<li>'+key1+': '+value1+'</li>';
											}
									 }
								  }
								}
								if (drillThroughHTML){
									if (Ext.is.Phone){
									   dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                       var drillThroughHTML = 'Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a>';
                                       cmp.update(['<div class="oneline">'+ storeItem.get(me.category)+': ' + dataresult + drillThroughHTML + '</div>'].join(''));
									}else{
                                       cmp.update(['<ul><li>'+me.categoryv +': '+ storeItem.get(me.category)+'</li>',dataresult,drillThroughHTML,'</ul>'].join(''));
									}
								}else{
									if (Ext.is.Phone){
                                       dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                       cmp.update(['<div class="oneline">'+storeItem.get(me.category)+': ' + dataresult + '</div>'].join(''));
									}else{
                                       cmp.update(['<ul><li>'+me.categoryv +': '+storeItem.get(me.category)+'</li>',dataresult,'</ul>'].join(''));
									}
                                }
                              }else {
								for(key in storeItem.data){
                                    for(var i=0;i<me.category.length;i++){
										if(key==me.category[i]){}
									}
									for(var j=0;j<me.measure.length;j++){
										if(key==me.measure[j]){
											key1= me.measurev[j];
											value1 = storeItem.data[key];
											value1 = me.renderValue(me.measure1t,value1);
											if (Ext.is.Phone){
												dataresult += value1 + ' ('+key1+'), ';
											}else{
											   dataresult += '<li>'+key1+': '+value1+'</li>';
											}
										}
									}
								}  
								if (drillThroughHTML){
									if (Ext.is.Phone){
									dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                    var drillThroughHTML = 'Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a>';
                                    cmp.update(['<div class="oneline">'+storeItem.get(me.category)+': '+ dataresult + drillThroughHTML +'</div>'].join(''));
									}else{
                                    cmp.update(['<ul><li>'+me.category1v +': '+ storeItem.get(me.category)+'</li>',dataresult,drillThroughHTML,'</ul>'].join(''));
									}
								}else{
									if (Ext.is.Phone){
									   dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                       cmp.update('<div class="oneline">'+[storeItem.get(me.category)+': ' + dataresult+'</div>'].join(''));
									}else{
                                       cmp.update(['<ul><li>'+me.category1v +': '+storeItem.get(me.category)+'</li>',dataresult,'</ul>'].join(''));
									}
                                }
							}
                         }
                    },	*/
                        xField: me.category,
                        yField: me.measure,
                        title: me.measurev,
                        showInLegend: true
                    }]
            });
            var myid = 'mp' + '-' + me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
            
            me.items = [{
                    // xtype: 'panel', 
                    // layout: {
                    //       type: 'vbox',
                    //        align: 'stretch',
                    //        pack : 'center'			
                    //  },
                    //  cls: 'myitem1',
                    //   items:  [{
                    //     xtype: 'panel', 
                    //	 id: myid,
                    //	 cls:'mp',
                    //	 html: 'Detail Information:',
                    //	 flex: 3
                    // },{
                    xtype: 'panel',
                    // flex: 10,
                    layout: 'fit',
                    items: [chart]
                // }]
                }];
        
        } else if (me.simbaview.viewInfo.type == 'area') {
            var titley = '';
            if (me.measure1v.length > 1) {
                titley = 'Measures';
            } else {
                titley = me.measure1v[0];
            }
            var faxes = [{
                    type: 'Numeric',
                    position: 'left',
                    fields: me.measure,
                    title: titley,
                    grid: true,
                    label: {
                        fill: '#fff',
                        renderer: function(v) {
                            return me.renderValue(me.measure1t, v);
                        }
                    },
                    labelTitle: {
                        fill: '#fff'
                    },
                    grid: {
                        odd: {
                            opacity: 1,
                            fill: '#000',
                            stroke: '#bbb',
                            'stroke-width': 1
                        },
                        even: {
                            opacity: 1,
                            fill: '#000',
                            stroke: '#bbb',
                            'stroke-width': 1
                        }
                    }
                }, {
                    type: 'Category',
                    position: 'bottom',
                    fields: me.category,
                    title: me.category1v[0],
                    label: {
                        fill: '#fff',
                        renderer: function(v) {
                            if (v === undefined) {
                            } 
                            else if (v.length > 5) {
                                return v.substr(0, 3) + '..';
                            } else {
                                return v;
                            }
                        }
                    },
                    labelTitle: {
                        fill: '#fff'
                    },
                    grid: false
                }];
            
            if (pos == 0 && neg > 0) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].maximum = 0;
                    }
                }
            } else if (pos > 0 && neg == 0) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].minimum = 0;
                    }
                }
            } else if (unum == datalen) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].maximum = 10;
                    }
                }
            } else {
            }
            
            var oldareaitem;
            var chart = new Ext.chart.Chart({
                theme: 'Demo',
                cls: 'area1',
                store: me.store,
                insetPadding: 20,
                animate: Ext.is.Blackberry ? false : true,
                legend: {
                    position: {
                        portrait: 'left',
                        landscape: 'left'
                    },
                    dock: Ext.is.Phone ? true : false
                },
                axes: faxes,
                series: [{
                        type: 'area',
                        highlight: true,
                        axis: 'left',
                        listeners: {
                            'itemtap': function(series, item, event) {
                                if (oldareaitem == undefined) {
                                    item.series.highlightItem(item);
                                    oldareaitem = item;
                                } else {
                                    oldareaitem.series.unHighlightItem(oldareaitem);
                                    oldareaitem = item;
                                    item.series.highlightItem(item);
                                }
                                var storeItem = item.storeItem;
                                var cmp = Ext.getCmp(myid);
                                var drillThroughCid = (me.simbaview.viewInfo.navigate && !_offline) ? me.simbaview.viewInfo.navigate.cid : 0;
                                if (drillThroughCid) {
                                    var drillThroughcaption = me.simbaview.viewInfo.navigate.caption;
                                    // var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                    var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                }
                                var dataresult = '';
                                for (key in storeItem.data) {
                                    for (var i = 0; i < me.category.length; i++) {
                                        if (key == me.category[i]) {
                                        }
                                    }
                                    for (var j = 0; j < me.measure.length; j++) {
                                        /*  if(key==me.measure[j]){
							           key1= me.measurev[j];
							           value1 = storeItem.data[key];
							           value1 = me.renderValue(me.measure1t,value1);
							           dataresult += '<li>'+key1+': '+value1+'</li>';
						            }*/
                                        if (key == me.measure[j] && key == item.storeField) {
                                            key1 = me.measurev[j];
                                            value1 = storeItem.data[key];
                                            value1 = me.renderValue(me.measure1t, value1);
                                            if (Ext.is.Phone) {
                                                dataresult += value1 + ' (' + key1 + '), ';
                                            } else {
                                                dataresult += '<li>' + key1 + ': ' + value1 + '</li>';
                                            }
                                        }
                                    
                                    }
                                }
                                if (drillThroughHTML) {
                                    if (Ext.is.Phone) {
                                        dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                        // var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                        var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                        cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + drillThroughHTML + '</div>'].join(''));
                                    } else {
                                        cmp.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, drillThroughHTML, '</ul>'].join(''));
                                    }
                                } else {
                                    if (Ext.is.Phone) {
                                        dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                        cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + '</div>'].join(''));
                                    } else {
                                        cmp.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, '</ul>'].join(''));
                                    }
                                }
                            }
                        },
                        xField: me.category,
                        yField: me.measure,
                        title: me.measurev,
                        showInLegend: true
                    }]
            });
            var myid = 'mp' + '-' + me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
            
            me.items = [{
                    xtype: 'panel',
                    layout: {
                        type: 'vbox',
                        align: 'stretch',
                        pack: 'center'
                    },
                    cls: 'myitem1',
                    items: [{
                            xtype: 'panel',
                            id: myid,
                            cls: 'mp',
                            html: 'Detail Information:',
                            flex: 3
                        }, {
                            xtype: 'panel',
                            flex: 10,
                            layout: 'fit',
                            items: [chart]
                        }]
                }];
        } else if (me.simbaview.viewInfo.type == 'line') {
            var num = me.measurev.length;
            
            var titley = '';
            if (me.measure1v.length > 1) {
                titley = 'Measures';
            } else {
                titley = me.measure1v[0];
            }
            var faxes = [{
                    type: 'Numeric',
                    position: 'left',
                    fields: me.measure,
                    title: titley,
                    grid: true,
                    //	minorTickSteps: 1,
                    label: {
                        fill: '#fff',
                        renderer: function(v) {
                            return me.renderValue(me.measure1t, v);
                        }
                    },
                    labelTitle: {
                        fill: '#fff'
                    },
                    grid: {
                        odd: {
                            opacity: 1,
                            fill: '#000',
                            stroke: '#bbb',
                            'stroke-width': 1
                        },
                        even: {
                            opacity: 1,
                            fill: '#000',
                            stroke: '#bbb',
                            'stroke-width': 1
                        }
                    }
                }, {
                    type: 'Category',
                    position: 'bottom',
                    fields: me.category.join(','),
                    title: me.category1v.join(','),
                    label: {
                        fill: '#fff',
                        rotate: {
                            degrees: 60
                        },
                        renderer: function(v) {
                            if (v === undefined) {
                            } 
                            else if (v.length > 5) {
                                return v.substr(0, 3) + '..';
                            } else {
                                return v;
                            }
                        }
                    },
                    labelTitle: {
                        fill: '#fff'
                    },
                    grid: false
                }];
            
            if (pos == 0 && neg > 0) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].maximum = 0;
                    }
                }
            } else if (pos > 0 && neg == 0) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].minimum = 0;
                    }
                }
            } else if (unum == datalen) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].maximum = 10;
                    }
                }
            } else {
            }
            
            
            series = [];
            for (var i = 0; i < num; i++) {
                var serie = {
                    type: 'line',
                    selectionTolerance: 45,
                    highlight: {
                        size: 10,
                        radius: 10
                    },
                    fill: false,
                    style: {
                        'stroke-width': 3,
                    },
                    smooth: true,
                    axis: 'left',
                    listeners: {
                        'itemtap': function(series, item, event) {
                            if (oldlineitem == undefined) {
                                item.series.highlightItem(item);
                                oldlineitem = item;
                            } else {
                                oldlineitem.series.unHighlightItem(oldlineitem);
                                oldlineitem = item;
                                item.series.highlightItem(item);
                            }
                            //var storeItem = item.storeItem;
                            var num = item.value[0];
                            var storeItem = item.storeItem.store.data.items[num];
                            
                            var cmp = Ext.getCmp(myid);
                            var dataresult = '';
                            
                            for (key in storeItem.data) {
                                for (var i = 0; i < me.category.length; i++) {
                                    if (key == me.category[i]) {
                                    }
                                }
                                for (var j = 0; j < me.measure.length; j++) {
                                    /*    if(key==me.measure[j]){
								   key1= me.measurev[j];
								   value1 = storeItem.data[key];
								   value1 = me.renderValue(me.measure1t,value1);
								   dataresult += '<li>'+key1+': '+value1+'</li>';
							     }
								 */
                                    if (key == me.measure[j] && key == series.yField) {
                                        key1 = me.measurev[j];
                                        value1 = storeItem.data[key];
                                        value1 = me.renderValue(me.measure1t, value1);
                                        if (Ext.is.Phone) {
                                            dataresult += value1 + ' (' + key1 + '), ';
                                        } else {
                                            dataresult += '<li>' + key1 + ': ' + value1 + '</li>';
                                        }
                                    }
                                }
                            }
                            var drillThroughCid = (me.simbaview.viewInfo.navigate && !_offline) ? me.simbaview.viewInfo.navigate.cid : 0;
                            if (drillThroughCid) {
                                var drillThroughcaption = me.simbaview.viewInfo.navigate.caption;
                                if (Ext.is.Phone) {
                                    dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                    // var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                    var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                    cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + drillThroughHTML + '</div>'].join(''));
                                } else {
                                    // var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                    var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                    cmp.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, drillThroughHTML, '</ul>'].join(''));
                                }
                            } else {
                                if (Ext.is.Phone) {
                                    dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                    cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + '</div>'].join(''));
                                } else {
                                    cmp.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, '</ul>'].join(''));
                                }
                            }
                        }
                    },
                    xField: me.category.join(','),
                    yField: me.measure[i],
                    title: me.measurev[i],
                    markerCfg: {
                        type: 'circle',
                        size: 2,
                        radius: 2,
                        'stroke-width': 0
                    }
                };
                series.push(serie);
            }
            var oldlineitem;
            var chart = new Ext.chart.Chart({
                store: me.store,
                animate: Ext.is.Blackberry ? false : true,
                insetPadding: 20,
                legend: {
                    position: {
                        portrait: 'left',
                        landscape: 'left'
                    },
                    dock: Ext.is.Phone ? true : false
                },
                axes: faxes,
                series: series
            });
            var myid = 'mp' + '-' + me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
            
            me.items = [{
                    xtype: 'panel',
                    layout: {
                        type: 'vbox',
                        align: 'stretch',
                        pack: 'center'
                    },
                    cls: 'myitem1',
                    items: [{
                            xtype: 'panel',
                            id: myid,
                            cls: 'mp',
                            html: 'Detail Information:',
                            flex: 3
                        }, {
                            xtype: 'panel',
                            flex: 10,
                            layout: 'fit',
                            items: [chart]
                        }]
                }];
        } else if (me.simbaview.viewInfo.type == 'linecolumn') {
            var num = me.measurev.length;
            var titley = '';
            if (me.measure1v.length > 1) {
                titley = 'Measures';
            } else {
                titley = me.measure1v[0];
            }
            
            var rmeasure = [];
            var lmeasure = [];
            var rmeasurev = [];
            var lmeasurev = [];
            var columnc = me.simbaview.viewInfo.measurePosition.column.length;
            var linec = me.simbaview.viewInfo.measurePosition.line.length;
            
            for (var i = 0; i < num; i++) 
            {
                for (var j = 0; j < columnc; j++) 
                {
                    if (me.measure[i] == me.simbaview.viewInfo.measurePosition.column[j]) 
                    {
                        rmeasure.push(me.measure[i]);
                        rmeasurev.push(me.measurev[i]);
                    }
                }
                for (var k = 0; k < linec; k++) 
                {
                    if (me.measure[i] == me.simbaview.viewInfo.measurePosition.line[k]) 
                    {
                        lmeasure.push(me.measure[i]);
                        lmeasurev.push(me.measurev[i]);
                    }
                }
            }
            
            var faxes = [{
                    type: 'Numeric',
                    position: 'left',
                    fields: lmeasure,
                    title: titley,
                    grid: true,
                    label: {
                        fill: '#fff',
                        renderer: function(v) {
                            return me.renderValue(me.measure1t, v);
                        }
                    },
                    labelTitle: {
                        fill: '#fff'
                    },
                    grid: {
                        odd: {
                            opacity: 1,
                            fill: '#000',
                            stroke: '#bbb',
                            'stroke-width': 1
                        },
                        even: {
                            opacity: 1,
                            fill: '#000',
                            stroke: '#bbb',
                            'stroke-width': 1
                        }
                    }
                }, {
                    type: 'Numeric',
                    position: 'right',
                    fields: rmeasure,
                    label: {
                        fill: '#fff',
                        renderer: function(v) {
                            return me.renderValue(me.measure1t, v);
                        }
                    }
                
                }, {
                    type: 'Category',
                    position: 'bottom',
                    fields: me.category.join(','),
                    title: me.category1v.join(','),
                    label: {
                        fill: '#fff',
                        rotate: {
                            degrees: 60
                        },
                        renderer: function(v) {
                            if (v === undefined) {
                            } 
                            else if (v.length > 5) {
                                return v.substr(0, 3) + '..';
                            } else {
                                return v;
                            }
                        }
                    },
                    labelTitle: {
                        fill: '#fff'
                    },
                    grid: false
                }];
            
            if (pos == 0 && neg > 0) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[i].maximum = 0;
                    }
                }
            } else if (pos > 0 && neg == 0) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[i].minimum = 0;
                    }
                }
            } else if (unum == datalen) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[i].maximum = 10;
                    }
                }
            } else {
            }
            
            
            series = [];
            var serie = {
                type: 'column',
                highlight: true,
                axis: 'right',
                listeners: {
                    'itemtap': function(series, item, event) {
                        var items = series.items;
                        if (oldlinecolumnitem == undefined) {
                            item.series.highlightItem(item);
                            oldlinecolumnitem = item;
                        } else {
                            oldlinecolumnitem.series.unHighlightItem(oldlinecolumnitem);
                            oldlinecolumnitem = item;
                            item.series.highlightItem(item);
                        }
                        
                        var cmp = Ext.getCmp(myid);
                        var storeItem = item.storeItem;
                        var drillThroughCid = (me.simbaview.viewInfo.navigate && !_offline) ? me.simbaview.viewInfo.navigate.cid : 0;
                        if (drillThroughCid) {
                            var drillThroughcaption = me.simbaview.viewInfo.navigate.caption;
                            // var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                            var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                        }
                        var dataresult = '';
                        if (me.categories && me.series && me.measures > 0) {
                            for (key in storeItem.data) {
                                for (var i = 0; i < me.category.length; i++) {
                                    if (key == me.category[i]) {
                                    }
                                }
                                /*	if(key==me.measure[0]){
										    key1= me.measurev[0];
											value1 = storeItem.data[key];
											value1 = me.renderValue(me.measure1t,value1);
											dataresult += '<li>'+key1+': '+value1+'</li>';
										}*/
                                
                                for (var j = 0; j < rmeasure.length; j++) {
                                    if (key == rmeasure[j]) {
                                        key1 = rmeasurev[j];
                                        value1 = storeItem.data[key];
                                        value1 = me.renderValue(me.measure1t, value1);
                                        if (Ext.is.Phone) {
                                            dataresult += value1 + ' (' + key1 + '), ';
                                        } else {
                                            dataresult += '<li>' + key1 + ': ' + value1 + '</li>';
                                        }
                                    }
                                }
                            
                            }
                            if (drillThroughHTML) {
                                if (Ext.is.Phone) {
                                    dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                    // var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                    var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                    cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + drillThroughHTML + '</div>'].join(''));
                                } else {
                                    cmp.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, drillThroughHTML, '</ul>'].join(''));
                                }
                            } else {
                                if (Ext.is.Phone) {
                                    dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                    cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + '</div>'].join(''));
                                } else {
                                    cmp.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, '</ul>'].join(''));
                                }
                            }
                        } else {
                            for (key in storeItem.data) {
                                for (var i = 0; i < me.category.length; i++) {
                                    if (key == me.category[i]) {
                                    }
                                }
                                /*    if(key==me.measure[0]){
										     key1= me.measurev[0];
						                   value1 = storeItem.data[key];
						                   value1 = me.renderValue(me.measure1t,value1);
							               dataresult += '<li>'+key1+': '+value1+'</li>';
										}*/
                                
                                for (var j = 0; j < rmeasure.length; j++) {
                                    if (key == rmeasure[j]) {
                                        key1 = rmeasurev[j];
                                        value1 = storeItem.data[key];
                                        value1 = me.renderValue(me.measure1t, value1);
                                        if (Ext.is.Phone) {
                                            dataresult += value1 + ' (' + key1 + '), ';
                                        } else {
                                            dataresult += '<li>' + key1 + ': ' + value1 + '</li>';
                                        }
                                    }
                                }
                            
                            }
                            if (drillThroughHTML) {
                                if (Ext.is.Phone) {
                                    dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                    // var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                    var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                    cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + drillThroughHTML + '</div>'].join(''));
                                } else {
                                    cmp.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, drillThroughHTML, '</ul>'].join(''));
                                }
                            } else {
                                if (Ext.is.Phone) {
                                    dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                    cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + '</div>'].join(''));
                                } else {
                                    cmp.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, '</ul>'].join(''));
                                }
                            }
                        }
                    }
                },
                xField: me.category.join(','),
                yField: rmeasure,
                title: rmeasurev
            };
            series.push(serie);
            
            for (var i = 0; i < lmeasure.length; i++) 
            {
                var serie1 = {
                    type: 'line',
                    highlight: {
                        size: 10,
                        radius: 10
                    },
                    selectionTolerance: 25,
                    fill: false,
                    style: {
                        'stroke-width': 3,
                    },
                    smooth: true,
                    axis: 'left',
                    listeners: {
                        'itemtap': function(series, item, event) {
                            if (oldlinecolumnitem == undefined) {
                                item.series.highlightItem(item);
                                oldlinecolumnitem = item;
                            } else {
                                oldlinecolumnitem.series.unHighlightItem(oldlinecolumnitem);
                                oldlinecolumnitem = item;
                                item.series.highlightItem(item);
                            }
                            //	var storeItem = item.storeItem;
                            var num = item.value[0];
                            var storeItem = item.storeItem.store.data.items[num];
                            
                            var cmp = Ext.getCmp(myid);
                            var dataresult = '';
                            
                            for (key in storeItem.data) {
                                for (var i = 0; i < me.category.length; i++) {
                                    if (key == me.category[i]) {
                                    }
                                }
                                for (var j = 0; j < me.measure.length; j++) {
                                    if (key == me.measure[j] && key == series.yField) {
                                        key1 = me.measurev[j];
                                        value1 = storeItem.data[key];
                                        value1 = me.renderValue(me.measure1t, value1);
                                        if (Ext.is.Phone) {
                                            dataresult += value1 + ' (' + key1 + '), ';
                                        } else {
                                            dataresult += '<li>' + key1 + ': ' + value1 + '</li>';
                                        }
                                    }
                                }
                            }
                            var drillThroughCid = (me.simbaview.viewInfo.navigate && !_offline) ? me.simbaview.viewInfo.navigate.cid : 0;
                            if (drillThroughCid) {
                                var drillThroughcaption = me.simbaview.viewInfo.navigate.caption;
                                // var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                if (Ext.is.Phone) {
                                    dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                    // var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                    var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                    cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + drillThroughHTML + '</div>'].join(''));
                                } else {
                                    cmp.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, drillThroughHTML, '</ul>'].join(''));
                                }
                            } else {
                                if (Ext.is.Phone) {
                                    dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                    cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + '</div>'].join(''));
                                } else {
                                    cmp.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, '</ul>'].join(''));
                                }
                            }
                        }
                    },
                    xField: me.category.join(','),
                    yField: lmeasure[i],
                    title: lmeasurev[i],
                    markerCfg: {
                        type: 'circle',
                        size: 2,
                        radius: 2,
                        'stroke-width': 0
                    }
                };
                series.push(serie1);
            }
            
            var oldlinecolumnitem;
            if (me.store.getCount() > 1) {
                var chart = new Ext.chart.Chart({
                    cls: 'linecolumn',
                    theme: 'Demo',
                    store: me.store,
                    animate: Ext.is.Blackberry ? false : true,
                    insetPadding: 20,
                    legend: {
                        position: {
                            portrait: 'left',
                            landscape: 'left'
                        },
                        dock: Ext.is.Phone ? true : false
                    },
                    interactions: [{
                            type: 'togglestacked',
                            gesture: 'pinch'
                        }],
                    
                    axes: faxes,
                    series: series
                });
                var myid = 'mp' + '-' + me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
                
                me.items = [{
                        xtype: 'panel',
                        layout: {
                            type: 'vbox',
                            align: 'stretch',
                            pack: 'center'
                        },
                        cls: 'myitem1',
                        items: [{
                                xtype: 'panel',
                                id: myid,
                                cls: 'mp',
                                html: 'Detail Information:',
                                flex: 3
                            }, {
                                xtype: 'panel',
                                flex: 10,
                                layout: 'fit',
                                items: [chart]
                            }]
                    }];
            } else {
                me.items = [{
                        xtype: 'panel',
                        layout: {
                            type: 'vbox',
                            align: 'stretch',
                            pack: 'center'
                        },
                        cls: 'myitem1',
                        html: '<span style="color:#D6B80A">Line Column chart cannot be drawn as there is just one group data.</span>'
                    }];
            }
        } else if (me.simbaview.viewInfo.type == 'radar') {
            var num = me.measure.length;
            series = [];
            for (var i = 0; i < num; i++) {
                var serie = {
                    type: 'radar',
                    xField: me.category,
                    yField: me.measure[i],
                    listeners: {
                        'itemtap': function(series, item, event) {
                            if (oldradaritem == undefined) {
                                item.series.highlightItem(item);
                                oldradaritem = item;
                            } else {
                                oldradaritem.series.unHighlightItem(oldradaritem);
                                oldradaritem = item;
                                item.series.highlightItem(item);
                            }
                            
                            var cmp = Ext.getCmp(myid);
                            cmp.addCls('mpc');
                            
                            var point = item.point;
                            var items = item.series.items;
                            var index = 0;
                            for (var i = 0; i < items.length; i++) {
                                if (items[i].point == point) {
                                    index = i;
                                }
                            }
                            var xf = series.xField[0];
                            var yf = series.yField;
                            var name = series.ownerCt.store.data.items[index].data[xf];
                            var value = series.ownerCt.store.data.items[index].data[yf];
                            //      if(String(value).indexOf('.')!=-1){
                            //        var num = value.toFixed(2);
                            //      }else{
                            //        var num = value;
                            //       }
                            var dataresult = '';
                            for (key in item.series.ownerCt.store.data.items[index].data) {
                                for (var i = 0; i < me.category.length; i++) {
                                    if (key == me.category[i]) {
                                    }
                                }
                                for (var j = 0; j < me.measure.length; j++) {
                                    /*    if(key==me.measure[j]){
						               key1= me.measurev[j];
						               value1 = item.series.ownerCt.store.data.items[index].data[key];
									   value1 = me.renderValue(me.measure1t,value1);
							           dataresult += '<li>'+key1+': '+value1+'</li>';
									}
									*/
                                    if (key == me.measure[j] && key == yf) {
                                        key1 = me.measurev[j];
                                        value1 = item.series.ownerCt.store.data.items[index].data[key];
                                        value1 = me.renderValue(me.measure1t, value1);
                                        if (Ext.is.Phone) {
                                            dataresult += value1 + ' (' + key1 + '), ';
                                        } else {
                                            dataresult += '<li>' + key1 + ': ' + value1 + '</li>';
                                        }
                                    }
                                }
                            }
                            var drillThroughCid = (me.simbaview.viewInfo.navigate && !_offline) ? me.simbaview.viewInfo.navigate.cid : 0;
                            if (drillThroughCid) {
                                var drillThroughcaption = me.simbaview.viewInfo.navigate.caption;
                                // var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + name + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + name + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                if (Ext.is.Phone) {
                                    dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                    // var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + name + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + cmp.getId() + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                    var drillThroughHTML = '<a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + name + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a>';
                                    cmp.update([name + ': ' + dataresult + drillThroughHTML + '<div class="myanchor"></div>'].join(''));
                                } else {
                                    cmp.update(['<ul><li>' + me.categoryv + ': ' + name + '</li>', dataresult, drillThroughHTML, '</ul>', '<div class="myanchor"></div>'].join(''));
                                }
                            } else {
                                if (Ext.is.Phone) {
                                    dataresult = dataresult.substr(0, dataresult.length - 2) + '. ';
                                    cmp.update([name + ': ' + dataresult + '<div class="myanchor"></div>'].join(''));
                                } else {
                                    cmp.update(['<ul><li>' + me.categoryv + ': ' + name + '</li>', dataresult, '</ul>', '<div class="myanchor"></div>'].join(''));
                                }
                            }
                        }
                    },
                    showInLegend: true,
                    showMarkers: true,
                    markerConfig: {
                        type: 'circle',
                        radius: 3,
                        size: 3
                    },
                    title: me.measurev[i],
                    fill: true
                };
                series.push(serie);
            }
            var oldradaritem;
            var chart = new Ext.chart.Chart({
                theme: 'Demo',
                cls: 'radar1',
                insetPadding: 20,
                store: me.store,
                animate: Ext.is.Blackberry ? false : true,
                shadow: true,
                legend: {
                    position: {
                        portrait: 'left',
                        landscape: 'left'
                    },
                    dock: Ext.is.Phone ? true : false
                },
                axes: [{
                        type: 'Radial',
                        position: 'radial',
                        label: {
                            display: true,
                            fill: '#fff',
                            renderer: function(v) {
                                return me.renderValue(me.measure1t, v);
                            }
                        }
                    }],
                series: series
            });
            var myid = 'mp' + '-' + me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
            
            me.items = [{
                    xtype: 'panel',
                    layout: {
                        type: 'vbox',
                        align: 'stretch',
                        pack: 'center'
                    },
                    //  cls: 'myitem1',
                    items: [{
                            xtype: 'panel',
                            flex: 2,
                            layout: {
                                type: 'vbox',
                                align: 'center',
                                pack: 'center'
                            },
                            items: [{
                                    xtype: 'panel',
                                    id: myid
                                }]
                        }, {
                            xtype: 'panel',
                            flex: 10,
                            layout: 'fit',
                            items: [chart]
                        }]
                }];
        
        } else if (me.simbaview.viewInfo.type == 'gaugeChart') {
            /*	Ext.chart.Legend.View.override({
    tpl: [
        '<ul class="' + Ext.baseCSSPrefix + 'legend-items">',
            '<tpl for=".">',
                    '{label}',
            '</tpl>',
        '</ul>'
    ],
   onItemTap: function(item, i, e) {},
});
*/
            var newmax = parseInt(me.simbaview.viewInfo.gaugeScale.max);
            var newmin = parseInt(me.simbaview.viewInfo.gaugeScale.min);
            var range = newmax - newmin;
            //console.log('range',range);
            
            
            var count = me.store.data.items.length;
            var myitems = me.store.data.items;
            
            for (var i = 0; i < count; i++) 
            {
                for (var j = 0; j < me.measure.length; j++) 
                {
                    if (myitems[i].data[me.measure[j]] > newmax) 
                    {
                        myitems[i].data[me.measure[j]] = newmax;
                    }
                }
            }
            
            var options1 = [];
            for (var i = 0; i < count; i++) 
            {
                var option = {};
                option.text = myitems[i].data[me.category];
                option.value = i;
                options1.push(option);
            }
            
            var chart = new Ext.chart.Chart({
                insetPadding: 35,
                animate: {
                    easing: 'elasticIn',
                    duration: 1000
                },
                store: me.store,
                axes: [{
                        type: 'gauge',
                        position: 'gauge',
                        label: {
                            fill: '#fff'
                        },
                        minimum: newmin,
                        maximum: newmax,
                        steps: 5,
                        margin: 10
                    }],
                series: [{
                        type: 'gauge',
                        field: me.measure[0],
                        needle: false,
                        donut: 85
                    }]
            });

            // chart.series.items[0].field = me.measure[0];
            var value = me.store.data.items[0].data[me.measure[0]];
            if (value < range * 0.25) 
            {
                chart.series.items[0].colorSet = ['#528ed6', '#ddd'];
                if (Ext.is.Phone) {
                    chart.axes.items[0].title = '(' + value + ')';
                } else {
                    chart.axes.items[0].title = options1[0].text + '(' + value + ')';
                }
            } 
            else if (value < range * 0.5) 
            {
                chart.series.items[0].colorSet = ['#7bd739', '#ddd'];
                if (Ext.is.Phone) {
                    chart.axes.items[0].title = '(' + value + ')';
                } else {
                    chart.axes.items[0].title = options1[0].text + '(' + value + ')';
                }
            } 
            else if (value < range * 0.75) 
            {
                chart.series.items[0].colorSet = ['#f7f742', '#ddd'];
                if (Ext.is.Phone) {
                    chart.axes.items[0].title = '(' + value + ')';
                } else {
                    chart.axes.items[0].title = options1[0].text + '(' + value + ')';
                }
            } 
            else if (value < newmax) 
            {
                chart.series.items[0].colorSet = ['#e76908', '#ddd'];
                if (Ext.is.Phone) 
                {
                    chart.axes.items[0].title = '(' + value + ')';
                } else {
                    chart.axes.items[0].title = options1[0].text + '(' + value + ')';
                }
            } 
            else if (value >= newmax) 
            {
                chart.series.items[0].colorSet = ['#c60000', '#ddd'];
                if (Ext.is.Phone) {
                    chart.axes.items[0].title = '(>=' + value + ')';
                } else {
                    chart.axes.items[0].title = options1[0].text + '(>=' + value + ')';
                }
            }
            
            var item1 = {
                xtype: 'selectfield',
                width: 160,
                name: 'ddl',
                options: options1,
                listeners: {
                    change: function(select, value) {
                        me.store.clearFilter();
                        me.store.filter(me.category[0], me.store.data.items[value].data[me.category[0]]);
                        var fvalue = me.store.data.items[0].data[me.measure[0]];
                        if (fvalue < range * 0.25) 
                        {
                            chart.series.items[0].colorSet = ['#528ed6', '#ddd'];
                            if (Ext.is.Phone) {
                                chart.axes.items[0].setTitle('(' + fvalue + ')');
                            } else {
                                chart.axes.items[0].setTitle(options1[value].data.text + '(' + fvalue + ')');
                            }
                        } 
                        else if (fvalue < range * 0.5) 
                        {
                            chart.series.items[0].colorSet = ['#7bd739', '#ddd'];
                            if (Ext.is.Phone) {
                                chart.axes.items[0].setTitle('(' + fvalue + ')');
                            } else {
                                chart.axes.items[0].setTitle(options1[value].data.text + '(' + fvalue + ')');
                            }
                        } 
                        else if (fvalue < range * 0.75) 
                        {
                            chart.series.items[0].colorSet = ['#f7f742', '#ddd'];
                            if (Ext.is.Phone) {
                                chart.axes.items[0].setTitle('(' + fvalue + ')');
                            } else {
                                chart.axes.items[0].setTitle(options1[value].data.text + '(' + fvalue + ')');
                            }
                        } 
                        else if (fvalue < newmax) 
                        {
                            chart.series.items[0].colorSet = ['#e76908', '#ddd'];
                            if (Ext.is.Phone) {
                                chart.axes.items[0].setTitle('(' + fvalue + ')');
                            } else {
                                chart.axes.items[0].setTitle(options1[value].data.text + '(' + fvalue + ')');
                            }
                        } 
                        else if (fvalue >= newmax) 
                        {
                            chart.series.items[0].colorSet = ['#c60000', '#ddd'];
                            if (Ext.is.Phone) {
                                chart.axes.items[0].setTitle('(>=' + fvalue + ')');
                            } else {
                                chart.axes.items[0].setTitle(options1[value].data.text + '(>=' + fvalue + ')');
                            }
                        }
                        chart.redraw();
                    }
                }
            };
            
            if (Ext.is.Phone) 
            {
                var pad = '1.3em 0';
                var margin = '0';
                var fs = '14px';
            } else {
                var pad = '1.3em 1em';
                var margin = '0 .2em';
            }
            
            me.items = [{
                    xtype: 'panel',
                    // id: 'gp',
                    layout: 'fit',
                    dockedItems: [{
                            dock: 'top',
                            xtype: 'toolbar',
                            title: '',
                            items: [item1]
                        }, {
                            dock: 'top',
                            xtype: 'toolbar',
                            defaults: {
                                layout: {
                                    type: 'hbox'
                                },
                                flex: 1,
                                defaults: {
                                    xtype: 'button',
                                    flex: 1
                                }
                            },
                            items: [{
                                    text: newmin + '..' + (range * 0.25 + newmin),
                                    ui: 'plain',
                                    style: {
                                        backgroundColor: '#528ed6',
                                        color: '#000',
                                        margin: margin,
                                        borderRadius: '0',
                                        padding: pad,
                                        fontSize: fs
                                    }
                                }, {
                                    text: (range * 0.25 + newmin) + '..' + (range * 0.5 + newmin),
                                    ui: 'plain',
                                    style: {
                                        backgroundColor: '#7bd739',
                                        color: '#000',
                                        margin: margin,
                                        borderRadius: '0',
                                        padding: pad,
                                        fontSize: fs
                                    }
                                }, {
                                    text: (range * 0.5 + newmin) + '..' + (range * 0.75 + newmin),
                                    ui: 'plain',
                                    style: {
                                        backgroundColor: '#f7f742',
                                        color: '#000',
                                        margin: margin,
                                        borderRadius: '0',
                                        padding: pad,
                                        fontSize: fs
                                    }
                                }, {
                                    text: (range * 0.75 + newmin) + '..' + newmax * 1,
                                    ui: 'plain',
                                    style: {
                                        backgroundColor: '#e76908',
                                        color: '#000',
                                        margin: margin,
                                        borderRadius: '0',
                                        padding: pad,
                                        fontSize: fs
                                    }
                                }, {
                                    text: newmax * 1 + '..',
                                    ui: 'plain',
                                    style: {
                                        backgroundColor: '#c60000',
                                        color: '#000',
                                        margin: margin,
                                        borderRadius: '0',
                                        padding: pad,
                                        fontSize: fs
                                    }
                                }]
                        }],
                    items: [chart]
                }];
        
        } else if (me.simbaview.viewInfo.type == 'column') {
            var titley = '';
            if (me.measure1v.length > 1) {
                titley = 'Measure';
            } else {
                titley = me.measure1v[0];
            }
            
            var fstack = false;
            if (me.simbaview.viewInfo.subType.indexOf('stacked') != -1) {
                fstack = true;
            }
            
            var faxes = [{
                    type: 'Numeric',
                    position: 'left',
                    fields: me.measure,
                    title: titley,
                    grid: true,
                    label: {
                        fill: '#fff',
                        renderer: function(v) {
                            return me.renderValue(me.measure1t, v);
                        }
                    },
                    labelTitle: {
                        fill: '#fff'
                    },
                    grid: {
                        opacity: 1,
                        fill: '#000',
                        stroke: '#bbb',
                        'stroke-width': 1
                    }
                }, {
                    type: 'Category',
                    position: 'bottom',
                    fields: me.category,
                    title: me.category1v.join(','),
                    label: {
                        fill: '#fff',
                        rotate: {
                            degrees: 60
                        },
                        renderer: function(v) {
                            if (v === undefined) {
                            } 
                            else if (v.length > 5) {
                                return v.substr(0, 3) + '..';
                            } else {
                                return v;
                            }
                        }
                    },
                    labelTitle: {
                        fill: '#fff'
                    },
                    grid: false
                }];
            
            if (pos == 0 && neg > 0) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].maximum = 0;
                    }
                }
            } else if (pos > 0 && neg == 0) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].minimum = 0;
                    }
                }
            } else if (unum == datalen) {
                for (var i = 0; i < faxes.length; i++) {
                    if (faxes[i].type == "Numeric") {
                        faxes[0].maximum = 10;
                    }
                }
            } else {
            }
            
            
            var oldcolumnitem = [];
            var chart = new Ext.chart.Chart({
                cls: 'column1',
                store: me.store,
                insetPadding: 20,
                animate: Ext.is.Blackberry ? false : {
                    easing: 'bounceOut',
                    duration: 750
                },
                legend: {
                    position: {
                        portrait: 'left',
                        landscape: 'left'
                    },
                    dock: Ext.is.Phone ? true : false
                },
                interactions: [{
                        type: 'togglestacked',
                        gesture: 'pinch'
                    }, {
                        type: 'iteminfo',
                        listeners: {
                            'show': function(ma, item, panel) {
								panel.on('beforehide',function(){
									// console.log('Before Hide Detail panel');
									var maskElement = Ext.DomQuery.selectNode('div.x-mask');
									// console.log('maskElement',maskElement);
									if(maskElement){
										maskElement.parentNode.removeChild(maskElement);
									}
								});
								if(panel.isHidden()) panel.show();
                                var items = item.series.items;
                                var fitems = [];
                                for (var i = 0; i < items.length; i++) {
                                    if (items[i].value[0] == item.value[0]) {
                                        fitems.push(items[i]);
                                    }
                                }
                                if (oldcolumnitem == undefined) {
                                    for (var j = 0; j < fitems.length; j++) {
                                        fitems[j].series.highlightItem(fitems[j]);
                                        oldcolumnitem.push(fitems[j]);
                                    }
                                } else {
                                    for (var k = 0; k < oldcolumnitem.length; k++) {
                                        oldcolumnitem[k].series.unHighlightItem(oldcolumnitem[k]);
                                    }
                                    delete oldcolumnitem;
                                    for (var m = 0; m < fitems.length; m++) {
                                        oldcolumnitem.push(fitems[m]);
                                        fitems[m].series.highlightItem(fitems[m]);
                                    }
                                }
                                
                                
                                var storeItem = item.storeItem;
                                var drillThroughCid = (me.simbaview.viewInfo.navigate && !_offline) ? me.simbaview.viewInfo.navigate.cid : 0;
                                if (drillThroughCid) {
                                    var drillThroughcaption = me.simbaview.viewInfo.navigate.caption;
                                    //var drillThroughHTML = '<li>Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a></li>';
                                    var drillThroughHTML = '<li><a class="drillth" drillThroughCid="' + drillThroughCid + '" categoryValue="' + storeItem.get(me.category) + '" categoryMapping="' + me.category + '" viewname="' + me.simbaview.viewName + '" reportid="' + me.reportid + '" pagecid="' + me.pagecid + '" simbapageid="' + me.simbapageid + '" panelId="' + panel.getId()+ '" onclick = "javascript: SimbaApp.chartDrillThrough(this);">' + drillThroughcaption + '</a></li>';
                                }
                                var dataresult = '';
                                if (me.categories && me.series && me.measures > 0) {
                                    for (key in storeItem.data) {
                                        for (var i = 0; i < me.category.length; i++) {
                                            if (key == me.category[i]) {
                                            }
                                        }
                                        for (var j = 0; j < me.measure.length; j++) {
                                            if (key == me.measure[j]) {
                                                key1 = me.measurev[j];
                                                value1 = storeItem.data[key];
                                                value1 = me.renderValue(me.measure1t, value1);
                                                //if (Ext.is.Phone){
                                                //   dataresult += value1 +' ('+key1+'), ';
                                                //}else{
                                                dataresult += '<li>' + key1 + ': ' + value1 + '</li>';
                                            //}
                                            }
                                        }
                                    }
                                    if (drillThroughHTML) {
                                        //if (Ext.is.Phone){
                                        //   var drillThroughHTML = 'Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a>';
                                        //   dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                        //   cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + drillThroughHTML + '</div>'].join(''));
                                        //}else{
                                        panel.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, drillThroughHTML, '</ul>'].join(''));
                                    //}
                                    } else {
                                        //if (Ext.is.Phone){
                                        //   dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                        //   cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + '</div>'].join(''));
                                        //}else{
                                        panel.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, '</ul>'].join(''));
                                    //}
                                    }
                                } else {
                                    for (key in storeItem.data) {
                                        for (var i = 0; i < me.category.length; i++) {
                                            if (key == me.category[i]) {
                                            }
                                        }
                                        for (var j = 0; j < me.measure.length; j++) {
                                            if (key == me.measure[j]) {
                                                key1 = me.measurev[j];
                                                value1 = storeItem.data[key];
                                                value1 = me.renderValue(me.measure1t, value1);
                                                //if (Ext.is.Phone){
                                                //  dataresult += value1 + ' ('+key1+'), ';
                                                // }else{
                                                dataresult += '<li>' + key1 + ': ' + value1 + '</li>';
                                            //}
                                            }
                                        }
                                    }
                                    if (drillThroughHTML) {
                                        //if (Ext.is.Phone){
                                        //   var drillThroughHTML = 'Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a>';
                                        //   dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                        //   cmp.update(['<div class="oneline">' + storeItem.get(me.category)+': ' + dataresult + drillThroughHTML + '</div>'].join(''));
                                        //}else{
                                        panel.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, drillThroughHTML, '</ul>'].join(''));
                                    //}
                                    } else {
                                        //if (Ext.is.Phone){
                                        //   dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                        //   cmp.update(['<div class="oneline">' + storeItem.get(me.category)+': '+ dataresult + '</div>'].join(''));
                                        //}else{
                                        panel.update(['<ul><li>' + me.categoryv + ': ' + storeItem.get(me.category) + '</li>', dataresult, '</ul>'].join(''));
                                    //}
                                    }
                                }
                            }
                        }
                    }],
                
                axes: faxes,
                series: [{
                        stacked: fstack,
                        type: 'column',
                        highlight: true,
                        axis: 'left',
                        /*	listeners: {
							'itemtap': function(series, item,  event) {
							var items = series.items;
							var fitems=[];
							for (var i=0;i<items.length;i++){
								if (items[i].value[0]==item.value[0]){
									fitems.push(items[i]);
							    }
							}
							if(oldcolumnitem==undefined){
								for (var j=0;j<fitems.length;j++){
									fitems[j].series.highlightItem(fitems[j]);
								    oldcolumnitem.push(fitems[j]);
								}
							}else{
								for (var k=0;k<oldcolumnitem.length;k++){
									oldcolumnitem[k].series.unHighlightItem(oldcolumnitem[k]);
								}
							    delete oldcolumnitem;
							    for (var m=0;m<fitems.length;m++){
									oldcolumnitem.push(fitems[m]);
							        fitems[m].series.highlightItem(fitems[m]);
							    }
							}

							//if(oldcolumnitem==undefined){
							//	item.series.highlightItem(item);
							//	oldcolumnitem = item;
							//}else{
						    //oldcolumnitem.series.unHighlightItem(oldcolumnitem);
							//oldcolumnitem=item;
							//item.series.highlightItem(item);
							//}

							  var cmp = Ext.getCmp(myid);
						      var storeItem = item.storeItem;
                              var drillThroughCid = (me.simbaview.viewInfo.navigate && ! _offline) ? me.simbaview.viewInfo.navigate.cid : 0;
                              if (drillThroughCid){
                                  var drillThroughcaption = me.simbaview.viewInfo.navigate.caption;
                                  var drillThroughHTML = '<li>Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a></li>';
				              }
				              var dataresult = '';
                              if (me.categories && me.series && me.measures>0){
					            for(key in storeItem.data){
                                    for(var i=0;i<me.category.length;i++){
									    if(key==me.category[i]){}
									}
									for(var j=0;j<me.measure.length;j++){
										if(key==me.measure[j]){
											key1= me.measurev[j];
											value1 = storeItem.data[key];
											value1 = me.renderValue(me.measure1t,value1);
											if (Ext.is.Phone){
                                               dataresult += value1 +' ('+key1+'), ';
											}else{
											   dataresult += '<li>'+key1+': '+value1+'</li>';
											}
										}
									}
								}
								if (drillThroughHTML){
									if (Ext.is.Phone){
                                       var drillThroughHTML = 'Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a>';
                                       dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                       cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + drillThroughHTML + '</div>'].join(''));
									}else{
                                       cmp.update(['<ul><li>'+me.categoryv+': ' + storeItem.get(me.category)+'</li>',dataresult,drillThroughHTML,'</ul>'].join(''));
									}
								}else{
									if (Ext.is.Phone){
                                       dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
									   cmp.update(['<div class="oneline">' + storeItem.get(me.category) + ': ' + dataresult + '</div>'].join(''));
									}else{
                                       cmp.update(['<ul><li>'+me.categoryv+': ' +storeItem.get(me.category)+'</li>',dataresult,'</ul>'].join(''));
									}
                                }
                              }else {
					             for(key in storeItem.data){
                                    for(var i=0;i<me.category.length;i++){
						                if(key==me.category[i]){}
					                }
					                for(var j=0;j<me.measure.length;j++){
						                if(key==me.measure[j]){
						                   key1= me.measurev[j];
						                   value1 = storeItem.data[key];
						                   value1 = me.renderValue(me.measure1t,value1);
										   if (Ext.is.Phone){
											  dataresult += value1 + ' ('+key1+'), ';
										   }else{
							                  dataresult += '<li>'+key1+': '+value1+'</li>';
										   }
										}
									}
								}  
								if (drillThroughHTML){
									if (Ext.is.Phone){
                                       var drillThroughHTML = 'Navigate: <a class="drillth" drillThroughCid="'+drillThroughCid+'" categoryValue="'+storeItem.get(me.category)+'" categoryMapping="'+me.category+'" viewname="'+me.simbaview.viewName+'" reportid="'+me.reportid+'" pagecid="'+me.pagecid+'" simbapageid="'+me.simbapageid+'" panelId="'+cmp.getId()+'" onclick = "javascript: SimbaApp.chartDrillThrough(this);">'+ drillThroughcaption + '</a>';
                                       dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
                                       cmp.update(['<div class="oneline">' + storeItem.get(me.category)+': ' + dataresult + drillThroughHTML + '</div>'].join(''));
									}else{
                                       cmp.update(['<ul><li>'+me.categoryv +': '+ storeItem.get(me.category)+'</li>',dataresult,drillThroughHTML,'</ul>'].join(''));
									}
								}else{
									if (Ext.is.Phone){
                                       dataresult = dataresult.substr(0,dataresult.length-2)+'. ';
									   cmp.update(['<div class="oneline">' + storeItem.get(me.category)+': '+ dataresult + '</div>'].join(''));
									}else{
                                       cmp.update(['<ul><li>'+me.categoryv +': '+storeItem.get(me.category)+'</li>',dataresult,'</ul>'].join(''));
									}
                                }
							  }
							}
						},*/
                        xField: me.category,
                        yField: me.measure,
                        title: me.measurev,
                        showInLegend: true
                    }]
            });
            
            var myid = 'mp' + '-' + me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
            
            me.items = [{
                    /*  xtype: 'panel', 
          layout: {
          type: 'vbox',
		  align: 'stretch',
		  pack : 'center'			
			  },
		  cls: 'myitem1',
          items:  [{
		     xtype: 'panel', 
			 id: myid,
			 html: 'Detail Information:',
			 cls:'mp',
			 flex: 3
		   },{*/
                    xtype: 'panel',
                    flex: 10,
                    layout: 'fit',
                    items: [chart]
                // }]
                }];
        }
        if (!me.pivotchart)
            me.id = me.pagecid + '-' + me.reportid + '-' + me.simbaview.viewName;
        me.simbatype = 'simbachart';
        SimbaApp.views.SimbaChart.superclass.initComponent.call(me, arguments);
    },
    
    renderValue: function(dataFormat, v) {
        //console.log(dataFormat,v);
        var me = this;
        if (v === '' || v === undefined)
            return v;
        if (parseFloat(v) != NaN)
            v = parseFloat(v);
        else
            return v;
        
        if (dataFormat) {
            if (dataFormat.maxDigits) {
                var maxDigits = parseInt(dataFormat.maxDigits);
            } 
            else {
                var maxDigits = 2;
            }
            //	var maxDigits = dataFormat.maxDigits ? parseInt(dataFormat.maxDigits) : 0;
            if (Ext.isNumber(v))
                v = v.toFixed(maxDigits);
            if (dataFormat.commas === 'true')
                v = me.addCommas(v);
            if (dataFormat.type === 'saw:currency')
                v = me.renderMoney(v);
            if (dataFormat.type === 'saw:percent')
                v = me.renderPercentage(v);
        } 
        else {
            if (Ext.isNumber(v)) {
                if (String(v).indexOf('.') != -1) 
                {
                    var temp = String(v).split('.');
                    v = temp[0] + '.' + temp[1].substring(0, 2);
                }
            }
        }
        return v;
    },
    
    renderMoney: function(v) {
        v = v + '';
        if (v.slice(0, 1) == '-')
            return '-$' + v.substr(1);
        else
            return '$' + v;
    },
    
    renderPercentage: function(v) {
        return v + '%';
    },
    
    addCommas: function(nStr) {
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
    
    buildStoreFromColumnInfo: function(columnInfo, data) {
        var me = this, 
        columnInfo = columnInfo || me.simbaview.viewInfo.columnInfo, 
        // data = data || me.simbaview.viewInfo.data,
        measureColumns = measureColumns || me.simbaview.viewInfo.measures, 
        categoryColumns = categoryColumns || me.simbaview.viewInfo.categories, 
        serieColumns = serieColumns || me.simbaview.viewInfo.series, 
        store, 
        fields = [];
        if (data == undefined) {
            data = (me.store) ? me.store.getRange() : me.simbaview.viewInfo.data;
        }
        for (var k in columnInfo) {
            if (categoryColumns[k] || serieColumns[k]) {
                var field = {
                    name: k,
                    type: columnInfo[k].dataType
                };
            } else {
                var field = {
                    name: k,
                    type: (columnInfo[k].dataType == 'string') ? 'float' : columnInfo[k].dataType
                };
            }
            fields.push(field);
        }
        store = new Ext.ux.SimbaStore({
            fields: fields,
            data: data
        });
        return store;
    },
    
    buildStoreFromColumnInfo2: function(columnInfo, data) {
        var me = this, 
        columnInfo = columnInfo || me.simbaview.viewInfo.columnInfo, 
        // data = data || me.simbaview.viewInfo.data,
        measureColumns = measureColumns || me.simbaview.viewInfo.measures, 
        categoryColumns = categoryColumns || me.simbaview.viewInfo.categories, 
        serieColumns = serieColumns || me.simbaview.viewInfo.series, 
        store, 
        fields = [];
        if (data == undefined) {
            data = (me.store) ? me.store.getRange() : me.simbaview.viewInfo.data;
        }
        for (var k in columnInfo) {
            var field = {
                name: k,
                type: columnInfo[k].dataType
            };
            fields.push(field);
        }
        store = new Ext.ux.SimbaStore({
            fields: fields,
            data: data
        });
        return store;
    },
    
    buildStore: function() {
        var me = this, 
        columnInfo = columnInfo || me.simbaview.viewInfo.columnInfo, 
        // data = data || me.simbaview.viewInfo.data,
        //data = me.store.getRange(),
        data2 = me.store2.getRange(), 
        measureColumns = measureColumns || me.simbaview.viewInfo.measures, 
        categoryColumns = categoryColumns || me.simbaview.viewInfo.categories, 
        serieColumns = serieColumns || me.simbaview.viewInfo.series, 
        store, 
        mColumns = [], 
        sColumns = [], 
        cColumns = [], 
        psrColumns = [], 
        fields = [];
        
        
        if (measureColumns.length == 0) {
        } else {
            for (var a in measureColumns) {
                mColumns.push(a);
            }
        }
        if (serieColumns.length == 0) {
        } else {
            for (var b in serieColumns) {
                sColumns.push(b);
                psrColumns.push(b);
            }
        }
        if (categoryColumns.length == 0) {
        } else {
            for (var c in categoryColumns) {
                cColumns.push(c);
                psrColumns.push(c);
            }
        }
        if (mColumns.length > 0 && sColumns.length > 0 && cColumns.length > 0) {
            //	var records = data;
            var records = data2;
            var ndata = [];
            var rdata = [];
            length = records.length;
            var newfields = [];
            for (var k in columnInfo) {
                if (categoryColumns[k]) {
                    var field = {
                        name: k,
                        type: columnInfo[k].dataType
                    };
                    fields.push(field);
                }
            }
            for (var i = 0; i < length; i++) {
                record = records[i].data;
                Ext.each(sColumns, function(sColumn, index, sColumns) {
                    var name = record[sColumn];
                    var field = {
                        name: name
                    //	type: (columnInfo[sColumn].dataType == 'string') ? 'float' : columnInfo[sColumn].dataType
                    
                    };
                    var result = true;
                    for (var j = 0; j < fields.length; j++) {
                        if (fields[j].name == field.name) {
                            result = false;
                        }
                    }
                    if (result) {
                        fields.push(field);
                        newfields.push(field.name);
                    }
                });
            }
            
            for (var i = 0; i < length; i++) {
                record = records[i].data;
                var fdata = {};
                for (var j = 0; j < newfields.length; j++) {
                    if (newfields[j] == record[sColumns]) {
                        fdata[newfields[j]] = record[mColumns];
                    } else {
                        fdata[newfields[j]] = "";
                    }
                }
                fdata[cColumns] = record[cColumns];
                ndata.push(fdata);
            }
            var chartstore = new Ext.ux.SimbaStore({
                fields: fields,
                data: ndata
            });
            groups = chartstore.groupBy1(psrColumns, cColumns, newfields, mColumns, sColumns);
            var tempStore = new Ext.ux.SimbaStore({
                fields: fields
            });
            
            Ext.each(groups, function(group, index, groups) {
                tempStore.loadData(group.children);
                var tempData = group.data;
                Ext.each(newfields, function(newfield, index, newfields) {
                    tempData[newfield] = tempStore.ssum(newfield);
                });
                rdata.push(tempData);
            });
            var store = new Ext.ux.SimbaStore({
                fields: fields,
                data: rdata
            });
            
            return store;
        
        } else if (cColumns.length > 1) {
            var ifields = [];
            var ndata = [];
            for (var k in columnInfo) {
                if (categoryColumns[k] || serieColumns[k]) {
                    var field = {
                        name: k,
                        type: columnInfo[k].dataType
                    };
                } else {
                    var field = {
                        name: k,
                    //        type: (columnInfo[k].dataType == 'string') ? 'float' : columnInfo[k].dataType
                    };
                }
                
                ifields.push(field);
            }
            var chartstore = new Ext.ux.SimbaStore({
                fields: ifields,
                //data  : data
                data: data2
            });
            var nfield = {
                name: cColumns.join(','),
                type: columnInfo[cColumns[0]].dataType
            };
            fields.push(nfield);
            for (var k in columnInfo) {
                if (measureColumns[k]) {
                    var field = {
                        name: k,
                    //	type: (columnInfo[k].dataType === 'string') ? 'float' : columnInfo[k].dataType
                    };
                    fields.push(field);
                }
            }
            groups = chartstore.groupBy2(psrColumns);
            var tempStore = new Ext.ux.SimbaStore({
                fields: fields
            });
            Ext.each(groups, function(group, index, groups) {
                tempStore.loadData(group.children);
                var tempData = group.data;
                Ext.each(mColumns, function(column, index, mColumns) {
                    tempData[column] = tempStore.ssum(column);
                });
                ndata.push(tempData);
            });
            var store = new Ext.ux.SimbaStore({
                fields: fields,
                data: ndata
            });
            return store;
        
        } else if (sColumns.length > 1) {
            var ifields = [];
            var ndata = [];
            for (var k in columnInfo) {
                if (categoryColumns[k] || serieColumns[k]) {
                    var field = {
                        name: k,
                        type: columnInfo[k].dataType
                    };
                } else {
                    var field = {
                        name: k,
                    // type: (columnInfo[k].dataType == 'string') ? 'float' : columnInfo[k].dataType
                    };
                }
                ifields.push(field);
            }
            var chartstore = new Ext.ux.SimbaStore({
                fields: ifields,
                //data  : data
                data: data2
            });
            
            var nfield = {
                name: sColumns.join(','),
                type: columnInfo[sColumns[0]].dataType
            };
            fields.push(nfield);
            for (var k in columnInfo) {
                if (measureColumns[k]) {
                    var field = {
                        name: k,
                    //type: (columnInfo[k].dataType === 'string') ? 'float' : columnInfo[k].dataType
                    };
                    fields.push(field);
                }
            }
            groups = chartstore.groupBy2(psrColumns);
            var tempStore = new Ext.ux.SimbaStore({
                fields: fields
            });
            Ext.each(groups, function(group, index, groups) {
                tempStore.loadData(group.children);
                var tempData = group.data;
                Ext.each(mColumns, function(column, index, mColumns) {
                    tempData[column] = tempStore.ssum(column);
                });
                ndata.push(tempData);
            });
            var store = new Ext.ux.SimbaStore({
                fields: fields,
                data: ndata
            });
            return store;
        
        } else {
            for (var k in columnInfo) {
                if (categoryColumns[k] || serieColumns[k]) {
                    var field = {
                        name: k,
                        type: columnInfo[k].dataType
                    };
                } else {
                    var field = {
                        name: k,
                    //   type: (columnInfo[k].dataType == 'string') ? 'float' : columnInfo[k].dataType
                    };
                }
                fields.push(field);
            }
            
            var data2len = data2.length;
            for (var i = 0; i < data2len; i++) {
                for (var j in data2[i].data) {
                    var reg = /^-|\d*\.?\d+$/;
                    if (reg.test(data2[i].data[j]) && j != cColumns[0]) {
                        data2[i].data[j] = parseFloat(data2[i].data[j])
                    } else {
                    }
                }
            }
            
            store = new Ext.ux.SimbaStore({
                fields: fields,
                //	data  : data
                data: data2
            });
            return store;
        }
    }

});