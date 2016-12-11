Ext.ns("Ext.ux");

// Ext.ux.ImageViewer = Ext.extend(Ext.Component, {
Ext.ux.ImageViewer = Ext.extend(Ext.Panel, {

	doubleTapScale: 1
	,maxScale: 1
	,loadingMask: true
	,previewSrc: false
	,imageSrc: false
	,initOnActivate: false
	,editable: false
	,drawn : false

	,cls: 'imageBox'
	,scroll: 'both'
	,html: [
		// '<figure><img></figure>'
		'<figure><canvas></figure>'
	]
	,strokeStyle : 'rgba(255, 255, 255, 0.4)'
	
	,fullscreen: (this.fullscreen == undefined) ? false : this.fullscreen
	
	,redraw: false
	,drawOrText: 'DRAW'

	,initComponent: function() {
		this.id = 'filepage_imgviewer_' + this.cid;
		// if(Ext.is.Android){
		// 	this.editable = false;
		// }
		// this.html[0] = '<figure id="filepage_figure_'+this.cid+'"><img id="filepage_img_'+this.cid+'"></figure>';
		if(this.editable){
			this.html[0] = '<figure id="filepage_figure_'+this.cid+'"><img id="filepage_img_' + this.cid + '"><canvas id="filepage_canvas_'+this.cid+'"></figure>';
		} else {
			this.html[0] = '<figure id="filepage_figure_'+this.cid+'"><img id="filepage_img_'+this.cid+'"></figure>';
		}
		
		if(this.fullscreen){
			this.style = {
				"z-index" : 100
			}
			this.dockedItems = this.createToolbar();
		}
		
		Ext.ux.ImageViewer.superclass.initComponent.apply(this, arguments);
	
		if(this.initOnActivate)
			this.on('activate', this.initViewer, this, {delay: 10, single: true});
		else
			this.on('afterrender', this.initViewer, this, {delay: 10, single: true});
	}
	
	, createToolbar: function(){
		var me = this,
			dockedItems = me.dockedItems || [];
		var toolbar = {
			xtype: 'toolbar',
			dock : 'top',
			items:[{
				xtype: 'button',
				text : 'Draw',
				hidden: me.editable ? false : true,
				handler: function(btn,e){
					if(btn.getText()=='Draw'){
						btn.setText('Text');
						me.drawOrText = 'TEXT';
					} else {
						btn.setText('Draw');
						me.drawOrText = 'DRAW';
					}
				}
				
			},{
				xtype: 'button',
				text: 'Remove',
				// hidden: me.editable ? false : true,
				hidden: true,
				handler: function(btn,e){
					var commentPanel = SimbaApp.views.viewport.commentPanel,
						commentImagePanel = commentPanel.dockedItems.items[1];
					var html = '<img></img>' ;
					commentImagePanel.update(html);
					// commentImagePanel.hide();
					commentImagePanel.ownerCt.doLayout();
					commentPanel.doLayout();
					me.destroy();
					SimbaApp.views.viewport.doLayout();
					_capturedFile = false;
				}
			},{
				xtype: 'spacer'
			},{
				xtype: 'button',
				text: 'Done',
				handler: function(btn,e){
					if(me.editable && me.drawn){
						if(_mode == 'native' && _capturedFile && window.plugins && window.plugins.screenshot){
							var commentPanel = SimbaApp.views.viewport.commentPanel,
								commentImagePanel = commentPanel.dockedItems.items[1];
							var Screenshot = window.plugins.screenshot;
							Screenshot.saveImageDataToFile(
								function(msg){
									var q = new Date().getTime() + '';
									commentImagePanel.getEl().down('img').dom.src = _capturedFile.fullPath + '?q=' + q;
									// var html = '<img width="50px" height="50px" src="'+_capturedFile.fullPath+'?q='+q+'"></img>' ;
									// commentImagePanel.update(html);
									me.destroy();
									SimbaApp.views.viewport.doLayout();
								}, 
								function(err){
									console.log(err);
									me.destroy();
								},
								_capturedFile.fileName,
								'filepage_canvas_'+me.cid
							);
						} else {
							me.destroy();
						}
					} else {
						me.destroy();
					}
				}
			// },{
			//	xtype: 'button',
			//	text : 'Open Image',
			//	handler: function(btn,e){
			//		var canvas = document.getElementById('filepage_canvas_'+me.cid);
			//		window.open(canvas.toDataURL());
			//	}
			}]
		};
		
		var editBar = {
            dock : 'bottom',
            xtype: 'toolbar',
			style: {
				'background' : 'transparent'
			},
			items: [{
				xtype: 'colorpickerfield',
				// label: 'Draw Color:',
				// labelWidth: '50%',
				name : 'draw-color',
				cls  : 'x-toolbar-field',
				width: 120,
				valueType: 'RGB',
				listeners: {
					select: function(field,value){
						// console.log('Field',field);
						// console.log('Value',value);
						me.strokeStyle = 'rgba(' + value + ', 0.4)';
					},
					afterrender: function(field){
						field.setValue({
							color: 'FF0000'
						});
						var value = field.getValue();
						me.strokeStyle = 'rgba(' + value + ', 0.4)';
						// console.log('Field',field);
						// console.log('Value',field.getValue());
					}
				}
			},{
				// xtype: 'togglefield'
				xtype: 'spacer'
			},{
				xtype: 'button',
				text : 'Clear',
				handler: function(btn,e){
					var canvas = document.getElementById('filepage_canvas_'+me.cid);
					// var context = canvas.getContext("2d");
					// context.clearRect(0, 0, canvas.width, canvas.height);
					canvas.width = canvas.width;
					me.redraw = true;
					me.drawn = false;
					me.initViewer();
				}
			}]
		};
		// console.log('dockedItems',dockedItems);
		dockedItems.unshift(toolbar);
		if(me.editable){
			dockedItems.push(editBar);
		}
		return dockedItems;
	}
	
	,initViewer: function() {
		
		//	disable scroller
		this.scroller.disable();

		// mask image viewer
		if(this.loadingMask)
			this.el.mask(Ext.LoadingSpinner);

		// retrieve DOM els
		this.figEl = this.el.down('figure');
		// this.imgEl = this.figEl.down('img');
		this.imgEl = this.figEl.down('img');
		this.canvasEl = this.figEl.down('canvas');
		
		if(! this.imgEl){
			var imgEl = document.createElement('img');
			this.figEl.appendChild(imgEl);
			this.imgEl = this.figEl.down('img');
		}

		// apply required styles
		this.figEl.setStyle({
			overflow: 'hidden'
			,display: 'block'
			,margin: 0
		});

		this.imgEl.setStyle({
			'-webkit-user-drag': 'none'
			,'-webkit-transform-origin': '0 0'
			,'visibility': 'hidden'
		});
		
		if(this.editable){
			this.canvasEl.setStyle({
				'visibility': 'hidden'
			});
		}

		// show preview
		if(this.previewSrc)
		{
			this.el.setStyle({
				backgroundImage: 'url('+this.previewSrc+')'
				,backgroundPosition: 'center center'
				,backgroundRepeat: 'no-repeat'
				,webkitBackgroundSize: 'contain'
			});
		}

		// attach event listeners
		this.mon(this.imgEl, {
			scope: this
			,load: this.onImageLoad
			,doubletap: this.onDoubleTap
			,pinchstart: this.onImagePinchStart
			,pinch: this.onImagePinch
			,pinchend: this.onImagePinchEnd
		});

		// load image
		if(this.imageSrc){
			if(this.editable && !this.redraw){
				var q = new Date().getTime() + '';
				this.imageSrc = this.imageSrc + '?q=' + q;
			}
			this.loadImage(this.imageSrc);
		}
			
		// if(this.imgId)
			// this.imgEl.set({id: this.imgId});
			
	}
	
	,loadImage: function(src) {	
		var me = this;
		if(this.imgEl){
			
			this.imgEl.dom.src = src;
		} else {
			this.imageSrc = src;
		}
	}

	
	,onImageLoad: function(imageObj) {
		// console.log('Loading image');
		// get viewport size
		this.viewportWidth = this.viewportWidth || this.getWidth() || this.ownerCt.body.getWidth();
		this.viewportHeight = this.viewportHeight || this.getHeight() || this.ownerCt.body.getHeight();
		// console.log('viewportWidth: ' + this.getWidth() + ' viewportHeight: ' + this.getHeight() );
		// grab image size
		this.imgWidth = this.imgEl.dom.width;
		this.imgHeight = this.imgEl.dom.height;
		// console.log('imgWidth: ' + this.imgWidth + ' imgHeight: ' + this.imgHeight );
		// calculate and apply initial scale to fit image to screen
		if(this.imgWidth > this.viewportWidth || this.imgHeight > this.viewportHeight)
			this.scale = this.baseScale = Math.min(this.viewportWidth/this.imgWidth, this.viewportHeight/this.imgHeight);
		else
			this.scale = this.baseScale = 1;
		
		// set initial translation to center
		this.translateX = this.translateBaseX = (this.viewportWidth - this.baseScale * this.imgWidth) / 2;
		this.translateY = this.translateBaseY = (this.viewportHeight - this.baseScale * this.imgHeight) / 2;
		
		// apply initial scale and translation
		this.applyTransform();
		
		// initialize scroller configuration
		this.adjustScroller();
		
		if(this.editable){
			var me = this;
			me.clicked = me.oldX = me.oldY =false;
			me.offsetX = me.offsetY = 0; 
			
			
			var drawParams = this.calcDrawParams();
			this.canvas = document.getElementById('filepage_canvas_'+this.cid);
			this.canvas.width = drawParams.viewportWidth || this.viewportWidth;
			this.canvas.height = drawParams.viewportHeight || this.viewportWidth;
			this.context = this.canvas.getContext("2d");
			console.log('drawParams',drawParams);
			var imageObj = new Image();
			imageObj.src = this.imageSrc;
			this.context.drawImage(imageObj, drawParams.sx, drawParams.sy, drawParams.swidth, drawParams.sheight);
			var coords = this.getCumulativeOffset();
			this.offsetX = coords.x;
			this.offsetY = coords.y;
			
			this.canvas.onmousedown = function(e) {
				if(me.drawOrText == 'TEXT') {
					var x = e.offsetX,
						y = e.offsetY;
					console.log('e',e);
					console.log('x:' + x);
					console.log('y:' + y);
					Ext.Msg.prompt(
						// 'Welcome!',
						// 'What\'s your name going to be today?',
						'',
						'Input here...',
						function(btn, value){
							console.log(btn);
							console.log(value);
							if(btn == 'ok' && value){
								// var c=document.getElementById("myCanvas");
								var ctx = me.canvas.getContext("2d");
								ctx.font = "30px Arial";
								// ctx.textAlign = "center";
								// ctx.fillStyle = "blue";
								ctx.fillStyle = me.strokeStyle;
								// ctx.fillText("Hello World",10,50);
								ctx.fillText(value,x,y);
								me.drawn = true;
							}
						},
						null,
						false
						// 'Test...'
					);
				} else {
					me.clicked = true;
				}
			};
			
			this.canvas.onmouseup = function() {
				if(me.drawOrText == 'TEXT') {
					return false;
				} else {
					me.oldX = me.oldY = me.clicked = false;
				}
			};
			
			// this.canvas.ontouchstart = function(e) {
				// if(me.drawOrText == 'TEXT') {
					// return false;
				// }
			// };
			
			this.canvas.ontouchend = function(e) {
				if(me.drawOrText == 'TEXT') {
					// var sx = e.changedTouches[0].screenX,
						// sy = e.changedTouches[0].screenY;
					// var cx = e.changedTouches[0].clientX,
						// cy = e.changedTouches[0].clientY;
					var px = e.changedTouches[0].pageX,
						py = e.changedTouches[0].pageY;
					py = py - 36;
					// console.log('e');
					// console.log(e);
					// console.log('targetTouches');
					// console.log(e.targetTouches[0]);
					// console.log('changedTouches');
					// console.log(e.changedTouches[0]);
					// console.log('touches');
					// console.log(e.touchs);
					// console.log('sx:' + sx);
					// console.log('sy:' + sy);
					// console.log('cx:' + cx);
					// console.log('cy:' + cy);
					// console.log('px:' + px);
					// console.log('py:' + py);
					Ext.Msg.prompt(
						// 'Welcome!',
						// 'What\'s your name going to be today?',
						'',
						'Input here...',
						function(btn, value){
							console.log(btn);
							console.log(value);
							if(btn == 'ok' && value){
								// var c=document.getElementById("myCanvas");
								var ctx = me.canvas.getContext("2d");
								ctx.font = "30px Arial";
								// ctx.textAlign = "center";
								// ctx.fillStyle = "blue";
								ctx.fillStyle = me.strokeStyle;
								// ctx.fillText("Hello World",10,50);
								// ctx.fillText('SX: ' + value,sx,sy);
								// ctx.fillText('CX: ' + value,cx,cy);
								ctx.fillText(value,px,py);
								me.drawn = true;
							}
						},
						null,
						false
						// 'Test...'
					);
				} else {
					me.oldX = me.oldY = me.clicked = false;
				}
			};
			// console.log('offsetX: ' + this.offsetX);
			// console.log('offsetY: ' + this.offsetY);
			// this.canvas.ontouchmove = this.handleMove;
			// this.canvas.onmousemove = this.handleMouseMove;
			this.canvas.ontouchmove = function(e) {
				if(me.drawOrText == 'TEXT') {
					return false;
				}
				var x, y, i;
				for (i = 0; i < e.targetTouches.length; i++) {
					// x = e.targetTouches[i].clientX - me.offsetX;
					// y = e.targetTouches[i].clientY - me.offsetY;
					x = e.targetTouches[i].clientX;
					y = e.targetTouches[i].clientY;
					y = y - 46;
					me.drawCircle(x, y);
				}
			};
			this.canvas.onmousemove = function(e){
				if(me.drawOrText == 'TEXT') return false;
				var x = e.offsetX,
					y = e.offsetY;
				if (me.clicked){
					me.drawCircle(x, y);			
				}
			}
		};
		
		

		// show image and remove mask
		if(this.editable){
			this.imgEl.remove();
			this.canvasEl.setStyle({ visibility: 'visible' });
		} else {
			this.imgEl.setStyle({ visibility: 'visible' });
		}
		

		// remove preview
		if(this.previewSrc)
		{
			this.el.setStyle({
				backgroundImage: 'none'
			});
		}

		if(this.loadingMask)
			this.el.unmask();

		this.fireEvent('imageLoaded', this);
	}
	
	,getCumulativeOffset: function() {
		var obj = this.canvas;
	    var left, top;
	    left = top = 0;
	    if (obj.offsetParent) {
	        do {
	            left += obj.offsetLeft;
	            top  += obj.offsetTop;
	        } while (obj = obj.offsetParent);
	    }
	    return {
	        x : left,
	        y : top
	    };
	}
	
	,drawCircle: function(x, y) {
		this.context.strokeStyle  = this.strokeStyle;
		// this.context.strokeStyle  = "rgba(255, 255, 255, 0.4)";
		this.context.lineWidth = 5;
		this.context.beginPath();
		if (this.oldX && this.oldY) {
	 		this.context.moveTo(this.oldX, this.oldY);
	 		this.context.lineTo(x, y);
	 		this.context.stroke();
			this.context.closePath();
		}
		this.oldX = x;
		this.oldY = y;
		if(this.drawn == false) this.drawn = true;
	}
	
	,calcDrawParams: function(){
		var drawParams = {
			sx     : 0,
			sy     : 0,
			swidth : 0,
			sheight: 0,
			viewportWidth: 0,
			viewportHeight: 0
		};
		// var viewportWidth = this.viewportWidth || this.getWidth() || this.ownerCt.body.getWidth();
		// var viewportHeight = this.viewportHeight || this.getHeight() || this.ownerCt.body.getHeight();
		var viewportSize = this.calcViewportSize();
		var viewportWidth = viewportSize.x;
		var viewportHeight = viewportSize.y;
		
		
		
		drawParams.swidth = drawParams.viewportWidth = viewportWidth;
		drawParams.sheight = drawParams.viewportHeight = viewportHeight;
		/*
		var imgWidth = this.imgEl.dom.width;
		var imgHeight = this.imgEl.dom.height;
		
		var scale = Math.min(viewportWidth/imgWidth, viewportHeight/imgHeight);
		console.log('scale: ' + scale);
		// console.log('viewportWidth: ' + viewportWidth);
		// console.log('viewportHeight: ' + viewportHeight);
		// console.log('imgWidth: ' + imgWidth);
		// console.log('imgHeight: ' + imgHeight);
		if(imgWidth > viewportWidth){
			drawParams.swidth = viewportWidth;
			var scaleX = viewportWidth/imgWidth;
			imgHeight = imgHeight * scaleX;
		} else {
			drawParams.swidth = imgWidth;
		}
		
		if(imgHeight > viewportHeight){
			drawParams.sheight = viewportHeight;
			var scaleY = viewportHeight/imgHeight;
			drawParams.swidth = drawParams.swidth * scaleY;
		} else {
			drawParams.sheight = imgHeight;
		}*/
		// console.log('drawParams sx: ' + drawParams.sx);
		// console.log('drawParams sy: ' + drawParams.sy);
		// console.log('drawParams swidth: ' + drawParams.swidth);
		// console.log('drawParams sheight: ' + drawParams.sheight);
		
		return drawParams;
	}
	
	,calcViewportSize: function(){
		var me = this,
			w=window,
			d=document,
			e=d.documentElement,
			g=d.getElementsByTagName('body')[0],
			x=w.innerWidth||e.clientWidth||g.clientWidth,
			y=w.innerHeight||e.clientHeight||g.clientHeight,
			viewportSize;
		if(Ext.is.Blackberry){
			viewportSize = {
				x: x,
				y: y-46
			};
		} else if(Ext.is.Phone){
			viewportSize = {
				x: x,
				y: y-46-46
			};
		} else if(Ext.is.iPad) {
			viewportSize = {
				x: me.fullscreen ? x : 750,
				y: y-46-46
			};
		} else {
			viewportSize = {
				x: me.fullscreen ? x : x-300,
				y: y-46-46
			};
		}
		// console.log('imgSize',imgSize);
		return viewportSize;
	}
	
	,onImageReLoad: function() {
		// console.log('Loading image');
		// get viewport size
		// this.viewportWidth =  this.getWidth() || this.ownerCt.body.getWidth() || this.viewportWidth;
		// this.viewportHeight = this.getHeight() || this.ownerCt.body.getHeight() || this.viewportHeight;
		var viewportSize = this.calcViewportSize();
		this.viewportWidth = viewportSize.x;
		this.viewportHeight = viewportSize.y;
		// console.log('viewportWidth: ' + this.getWidth() + ' viewportHeight: ' + this.getHeight() );
		// grab image size
		this.imgWidth = this.imgEl.dom.width;
		this.imgHeight = this.imgEl.dom.height;
		// console.log('imgWidth: ' + this.imgWidth + ' imgHeight: ' + this.imgHeight );
		// calculate and apply initial scale to fit image to screen
		if(this.imgWidth > this.viewportWidth || this.imgHeight > this.viewportHeight)
			this.scale = this.baseScale = Math.min(this.viewportWidth/this.imgWidth, this.viewportHeight/this.imgHeight);
		else
			this.scale = this.baseScale = 1;
		
		// set initial translation to center
		this.translateX = this.translateBaseX = (this.viewportWidth - this.baseScale * this.imgWidth) / 2;
		this.translateY = this.translateBaseY = (this.viewportHeight - this.baseScale * this.imgHeight) / 2;
		
		// apply initial scale and translation
		this.applyTransform();
		
		// initialize scroller configuration
		this.adjustScroller();

		// show image and remove mask
		this.imgEl.setStyle({ visibility: 'visible' });

		// remove preview
		if(this.previewSrc)
		{
			this.el.setStyle({
				backgroundImage: 'none'
			});
		}

		if(this.loadingMask)
			this.el.unmask();

		this.fireEvent('imageLoaded', this);
	}
	
	,onImagePinchStart: function(ev) {
		// disable scrolling during pinch
		this.scroller.stopMomentumAnimation();
		this.scroller.disable();
		
		// store beginning scale
		this.startScale = this.scale;
		
		// calculate touch midpoint relative to image viewport
		this.originViewportX = (ev.touches[0].clientX + ev.touches[1].clientX) / 2 - this.el.getX();
		this.originViewportY = (ev.touches[0].clientY + ev.touches[1].clientY) / 2 - this.el.getY();
		
		// translate viewport origin to position on scaled image
		this.originScaledImgX = this.originViewportX - this.scroller.offset.x - this.translateX;
		this.originScaledImgY = this.originViewportY - this.scroller.offset.y - this.translateY;
		
		// unscale to find origin on full size image
		this.originFullImgX = this.originScaledImgX / this.scale;
		this.originFullImgY = this.originScaledImgY / this.scale;
		
		// calculate translation needed to counteract new origin and keep image in same position on screen
		this.translateX += (-1 * ((this.imgWidth*(1-this.scale)) * (this.originFullImgX/this.imgWidth)));
		this.translateY += (-1 * ((this.imgHeight*(1-this.scale)) * (this.originFullImgY/this.imgHeight)))
	
		// apply new origin
		this.setOrigin(this.originFullImgX, this.originFullImgY);
	
		// apply translate and scale CSS
		this.applyTransform();
	}
	
	,onImagePinch: function(ev) {
		// prevent scaling to smaller than screen size
		this.scale = Ext.util.Numbers.constrain(ev.scale * this.startScale, this.baseScale, this.maxScale);
		this.applyTransform();
	}
	
	,onImagePinchEnd: function(ev) {
	
		// set new translation
		if(this.scale == this.baseScale)
		{
			// move to center
			this.setTranslation(this.translateBaseX, this.translateBaseY);
		}
		else
		{
			// calculate rescaled origin
			this.originReScaledImgX = this.originScaledImgX * (this.scale / this.startScale);
			this.originReScaledImgY = this.originScaledImgY * (this.scale / this.startScale);
			
			// maintain zoom position
			this.setTranslation(this.originViewportX - this.originReScaledImgX, this.originViewportY - this.originReScaledImgY);			
		}
		// reset origin and update transform with new translation
		this.setOrigin(0, 0);
		this.applyTransform();

		// adjust scroll container
		this.adjustScroller();
	}
	
	,resetToOriginal: function(){
		this.scale = this.baseScale;
		this.setTranslation(this.translateBaseX, this.translateBaseY);
		this.applyTransform();
		this.adjustScroller();
		Ext.repaint();
	}

	,onDoubleTap: function(ev, t) {
		// console.log('Double Tap');
		if(!this.doubleTapScale)
			return false;
		
		// set scale and translation
		if(this.scale >= .9)
		{
			// zoom out to base view
			this.scale = this.baseScale;
			this.setTranslation(this.translateBaseX, this.translateBaseY);
		}
		else
		{
			// zoom in toward tap position
			var oldScale = this.scale
				,newScale = 1
				,originViewportX = ev ? (ev.pageX - this.el.getX()) : 0
				,originViewportY = ev ? (ev.pageY - this.el.getY()) : 0
				,originScaledImgX = originViewportX - this.scroller.offset.x - this.translateX
				,originScaledImgY = originViewportY - this.scroller.offset.y - this.translateY
				,originReScaledImgX = originScaledImgX * (newScale / oldScale)
				,originReScaledImgY = originScaledImgY * (newScale / oldScale);
				
			this.scale = newScale;
			this.setTranslation(originViewportX - originReScaledImgX, originViewportY - originReScaledImgY);
		}
			
		// reset origin and update transform with new translation
		this.applyTransform();

		// adjust scroll container
		this.adjustScroller();
		
		// force repaint to solve occasional iOS rendering delay
		Ext.repaint();
	}
	
	,setOrigin: function(x, y) {
		this.imgEl.dom.style.webkitTransformOrigin = x+'px '+y+'px';
	}
	
	,setTranslation:  function(translateX, translateY) {
		this.translateX = translateX;
		this.translateY = translateY;
			
		// transfer negative translations to scroll offset
		this.scrollX = this.scrollY = 0;
		
		if(this.translateX < 0)
		{
			this.scrollX = this.translateX;
			this.translateX = 0;
		}
		if(this.translateY < 0)
		{
			this.scrollY = this.translateY;
			this.translateY = 0;
		}
	}
		

	,applyTransform: function() {
	
		var fixedX = Ext.util.Numbers.toFixed(this.translateX,5)
			,fixedY = Ext.util.Numbers.toFixed(this.translateY,5)
			,fixedScale = Ext.util.Numbers.toFixed(this.scale, 8);
	
		if(Ext.is.Android)
		{
			this.imgEl.dom.style.webkitTransform = 
				//'translate('+fixedX+'px, '+fixedY+'px)'
				//+' scale('+fixedScale+','+fixedScale+')';
				'matrix('+fixedScale+',0,0,'+fixedScale+','+fixedX+','+fixedY+')'
		}
		else
		{
			this.imgEl.dom.style.webkitTransform =
				'translate3d('+fixedX+'px, '+fixedY+'px, 0)'
				+' scale3d('+fixedScale+','+fixedScale+',1)';
		}
		
	}


	,adjustScroller: function(scrollX,scrollY) {
	
		// disable scrolling if zoomed out completely, else enable it
		if(this.scale == this.baseScale)
			this.scroller.disable();
		else
			this.scroller.enable();
		
		// size container to final image size
		var boundWidth = Math.max(this.imgWidth * this.scale, this.viewportWidth);
		var boundHeight = Math.max(this.imgHeight * this.scale, this.viewportHeight);

		this.figEl.setStyle({
			width: boundWidth + 'px'
			,height: boundHeight + 'px'
		});
		
		// update scroller to new content size
		this.scroller.updateBoundary();

		// apply scroll
		this.scroller.setOffset({
			x: scrollX || this.scrollX || 0
			,y: scrollY || this.scrollY || 0
		});
	}

});

Ext.reg('imageviewer', Ext.ux.ImageViewer);