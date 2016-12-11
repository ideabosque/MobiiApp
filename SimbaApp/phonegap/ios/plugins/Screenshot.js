/*
 *  This code is adapted from the work of Michael Nachbaur 
 *  by Simon Madine of The Angry Robot Zombie Factory
 *   - Converted to Cordova 1.6.1 by Josemando Sobral.
 *  2012-06-03
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
		cordovaRef.exec("Screenshot.saveScreenshot");
	};
	
	
	 /**
	 * Save the screenshot to app Documents directory
	 */
	Screenshot.prototype.saveScreenshotAsFile = function( fileName, success, fail) {
    	// cordovaRef.exec("Screenshot.saveScreenshotAsFile", fileName, successCallbackString);
    	cordovaRef.exec(success, fail,"Screenshot","saveScreenshotAsFile", fileName);
	};
	
	/**
	 * Delete the saved screenshot from app Documents directory
	 */
	Screenshot.prototype.deleteSavedScreenshotFile = function(fileName) {
		cordovaRef.exec("Screenshot.deleteSavedScreenshotFile",fileName);
	};
	
	/**
	 * Delete all saved screenshots from app Documents directory
	 */
	Screenshot.prototype.clearAllScreenshots = function() {
		cordovaRef.exec("Screenshot.clearAllScreenshots");
	};
	
	Screenshot.prototype.saveImageDataToLibrary = function(success, fail, canvasId) {
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
		var imageData = canvas.toDataURL().replace(/data:image\/png;base64,/,'');
		cordovaRef.exec(success, fail,"Screenshot","saveImageDataToLibrary", [imageData]);
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
		var imageData = canvas.toDataURL().replace(/data:image\/png;base64,/,'');
		cordovaRef.exec(success, fail,"Screenshot","saveImageDataToFile", [fileName, imageData]);
	};


	cordovaRef.addConstructor(function() {
		if (!window.plugins) {
			window.plugins = {};
		}
		if (!window.plugins.screenshot) {
			window.plugins.screenshot = new Screenshot();
		}
	});

 })(); /* End of Temporary Scope. */