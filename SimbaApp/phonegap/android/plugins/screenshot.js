/*
 *  This code is adapted from the work of Michael Nachbaur 
 *  by Simon Madine of The Angry Robot Zombie Factory
 *   - Converted to Cordova 1.6.1 by Josemando Sobral.
 *  2012-07-03
 *  MIT licensed
 */

/*
 * Temporary Scope to contain the plugin.
 *  - More information here:
 *     https://github.com/apache/incubator-cordova-ios/blob/master/guides/Cordova%20Plugin%20Upgrade%20Guide.md
 */
(function() {
	/* Get local ref to global PhoneGap/Cordova/cordova object for exec function.
		- This increases the compatibility of the plugin. */
	var cordovaRef = window.PhoneGap || window.Cordova || window.cordova; // old to new fallbacks

	/**
	 * This class exposes the ability to take a Screenshot to JavaScript
	 */
	function Screenshot() { }

	/**
	 * Save the screenshot to the user's Photo Library
	 */
	Screenshot.prototype.saveScreenshot = function() {
		cordovaRef.exec(null, null, "Screenshot", "saveScreenshot", []);
	};
	
	/**
	 * Save the screenshot to "MobiiApp/Screenshots"
	 */
	Screenshot.prototype.saveScreenshotAsFile = function(data,success,fail) {
        var w=window,
            d=document,
            e=d.documentElement,
            g=d.getElementsByTagName('body')[0],
            x=w.innerWidth||e.clientWidth||g.clientWidth,
            y=w.innerHeight||e.clientHeight||g.clientHeight;
        data.push(x);
        data.push(y);
        // console.log('X:' + x);
        // console.log('Y:' + y);
		cordovaRef.exec(success, fail, "Screenshot", "saveScreenshotAsFile", data);
	};
	
	/**
	 * Delete saved screenshot file in "MobiiApp/Screenshots"
	 */
	Screenshot.prototype.deleteSavedScreenshotFile = function(fileName,success,fail) {
		cordovaRef.exec(success, fail, "Screenshot", "deleteSavedScreenshotFile", [fileName]);
	};
	
	Screenshot.prototype.clearAllScreenshots = function(success,fail){
		cordovaRef.exec(success,fail,"Screenshot","clearAllScreenshots",[]);
	};
	
	Screenshot.prototype.saveImageDataToFile = function(success, fail, fileName, canvasId) {
		// successCallback required
		if (typeof success != "function") {
        	console.log("Canvas2ImagePlugin Error: successCallback is not a function");
        	return;
    	}
		if (typeof fail != "function") {
        	console.log("Canvas2ImagePlugin Error: failureCallback is not a function");
        	return;
    	}
		var canvas = document.getElementById(canvasId);
		var coord = this.getCoord(canvas,0,0);
		// console.log('FileName: ' + fileName);
		// console.log('Canvas Left: ' + coord.left);
		// console.log('Canvas Top: ' + coord.top);
		// console.log('Canvas Width: ' + coord.width);
		// console.log('Canvas Height: ' + coord.height);
		// var imageData = canvas.toDataURL().replace(/data:image\/png;base64,/,'');
		cordovaRef.exec(success, fail,"Screenshot","saveImageDataToFile", [fileName, coord.left, coord.top, coord.width, coord.height,]);
	};
	
	Screenshot.prototype.getCoord = function (obj, offsetLeft, offsetTop){
        var orig = obj;
        var left = 0;
        var top = 0;
        if(offsetLeft) left = offsetLeft;
        if(offsetTop) top = offsetTop;
        if(obj.offsetParent){
                left += obj.offsetLeft;
                top += obj.offsetTop;
                while (obj = obj.offsetParent) {
                        left += (obj.offsetLeft-obj.scrollLeft+obj.clientLeft);
                        top += (obj.offsetTop-obj.scrollTop+obj.clientTop);
                }
        }
        return {left:left, top:top, width: orig.offsetWidth, height: orig.offsetHeight};
	}

	cordovaRef.addConstructor(function() {
		if (!window.plugins) {
			window.plugins = {};
		}
		if (!window.plugins.screenshot) {
			window.plugins.screenshot = new Screenshot();
		}
	});

 })(); /* End of Temporary Scope. */