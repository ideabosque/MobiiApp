/**
 * Copyright (C) 2012 30ideas (http://30ide.as)
 * MIT licensed
 * 
 * @author Josemando Sobral
 * @created Jul 2nd, 2012.
 */
package org.apache.cordova;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;

// import org.apache.cordova.api.LOG;
import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import android.graphics.Bitmap;
import android.os.Environment;
import android.view.View;

public class Screenshot extends Plugin {
	private PluginResult result = null;

	@Override
	public PluginResult execute(String action, final JSONArray args, String callbackId) {
		// starting on ICS, some WebView methods
		// can only be called on UI threads
		// LOG.d("Screenshot", "action: " + action);
		// if(action == "saveScreenshot"){
		if(action.equals("saveScrenshot")){
			result = null;
			super.cordova.getActivity().runOnUiThread(new Runnable() {
				@Override
				public void run() {
					View view = webView.getRootView();
	
					view.setDrawingCacheEnabled(true);
					Bitmap bitmap = Bitmap.createBitmap(view.getDrawingCache());
					view.setDrawingCacheEnabled(false);
	
					try {
						File folder = new File(Environment.getExternalStorageDirectory(), "Pictures");
						if (!folder.exists()) {
							folder.mkdirs();
						}
	
						File f = new File(folder, "screenshot_" + System.currentTimeMillis() + ".png");
	
						FileOutputStream fos = new FileOutputStream(f);
						bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
						result = new PluginResult(PluginResult.Status.OK);
	
					} catch (IOException e) {
						result = new PluginResult(PluginResult.Status.IO_EXCEPTION, e.getMessage());
					}
				}
			});
		// } else if(action == "saveScreenshotAsFile"){
		} else if(action.equals("saveScreenshotAsFile")){
			result = null;
			super.cordova.getActivity().runOnUiThread(new Runnable() {
				@Override
				public void run() {
					
	
					try {
						String fileName = "";
						int dstWidth = 0;
						int dstHeight = 0;
						try {
							fileName = args.getString(0);
							dstWidth = args.getInt(1);
							dstHeight = args.getInt(2);
							
							View view = webView.getRootView();
							view.setDrawingCacheEnabled(true);
							// Bitmap bitmap = Bitmap.createBitmap(view.getDrawingCache());
							Bitmap bitmap = Bitmap.createScaledBitmap(view.getDrawingCache(), dstWidth, dstHeight, true);
							view.setDrawingCacheEnabled(false);
							
							// LOG.d("Screenshot", "ORG width: " + bitmap.getWidth());
							// LOG.d("Screenshot", "ORG height: " + bitmap.getHeight());
							// LOG.d("Screenshot", "dstWidth: " + dstWidth);							
							// LOG.d("Screenshot", "dstHeight: " + dstHeight);
							File folder = new File(Environment.getExternalStorageDirectory() + "/MobiiApp/Screenshots/");
							if (!folder.exists()) {
								folder.mkdirs();
							}
							
							String fileFullPath = folder.getPath() + "/" + fileName;
							// LOG.d("Screenshot", "fileFullPath: " + fileFullPath);
		
							File f = new File(fileFullPath);
		
							FileOutputStream fos = new FileOutputStream(f);
							bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
							result = new PluginResult(PluginResult.Status.OK,fileFullPath);
						} catch (JSONException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
						}
					} catch (IOException e) {
						result = new PluginResult(PluginResult.Status.IO_EXCEPTION, e.getMessage());
					}
				}
			});
		} else if(action.equals("saveImageDataToFile")){
			result = null;
			super.cordova.getActivity().runOnUiThread(new Runnable() {
				@Override
				public void run() {
						try {
							String fileName = args.getString(0);
							int left = args.getInt(1);
							int top = args.getInt(2);
							int width = args.getInt(3);
							int height = args.getInt(4);
							
							float appScale = webView.getScale();
							
							// LOG.d("Screenshot", "fileName: " + fileName);
							// LOG.d("Screenshot", "left: " + left);
							// LOG.d("Screenshot", "top: " + top);
							// LOG.d("Screenshot", "width: " + width);
							// LOG.d("Screenshot", "height: " + height);
							// LOG.d("Screenshot", "appScale: " + appScale);
							
							int scaledLeft = (int) (left * appScale);
							int scaledTop = (int) (top * appScale * appScale);
							int scaledWidth = (int) (width * appScale);
							int scaledHeight = (int) (height * appScale);
							
							int webViewWidth = webView.getWidth();
							int webViewHeight = webView.getHeight();
							
							if(scaledWidth > webViewWidth){
								scaledWidth = webViewWidth;
							}
							if(scaledHeight > webViewHeight){
								scaledHeight = webViewHeight;
							}
							
							// LOG.d("Screenshot", "scaledLeft: " + scaledLeft);
							// LOG.d("Screenshot", "scaledTop: " + scaledTop);
							// LOG.d("Screenshot", "scaledWidth: " + scaledWidth);
							// LOG.d("Screenshot", "scaledHeight: " + scaledHeight);
							
							View view = webView.getRootView();
							
							view.setDrawingCacheEnabled(true);
							// Bitmap bitmap = Bitmap.createBitmap(view.getDrawingCache(),left,top,width,height);
							Bitmap bitmap = Bitmap.createBitmap(view.getDrawingCache(),scaledLeft,scaledTop,scaledWidth,scaledHeight);
							view.setDrawingCacheEnabled(false);
							
							File folder = new File(Environment.getExternalStorageDirectory() + "/MobiiApp/Screenshots/");
							if (!folder.exists()) {
								folder.mkdirs();
							}
							
							String fileFullPath = folder.getPath() + "/" + fileName;
							// LOG.d("Screenshot", "fileFullPath: " + fileFullPath);
		
							File f = new File(fileFullPath);
							/*
							if (!f.exists()) {
								f.delete();
							}*/
		
							FileOutputStream fos;
							try {
								fos = new FileOutputStream(f);
								bitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
								result = new PluginResult(PluginResult.Status.OK,fileFullPath);
							} catch (FileNotFoundException e) {
								// TODO Auto-generated catch block
								e.printStackTrace();
								result = new PluginResult(PluginResult.Status.IO_EXCEPTION, e.getMessage());
							}
						} catch (JSONException e) {
							// TODO Auto-generated catch block
							e.printStackTrace();
							result = new PluginResult(PluginResult.Status.IO_EXCEPTION, e.getMessage());
						}
				}
			});
		} else if(action.equals("deleteSavedScreenshotFile")){
			result = null;
			super.cordova.getActivity().runOnUiThread(new Runnable() {
				@Override
				public void run() {
					try{
						String folderDirectory = Environment.getExternalStorageDirectory()+"/MobiiApp/Screenshots/";
						String fileName = args.getString(0);
						String fileFullPath = folderDirectory + fileName;
						// LOG.d("Screenshot","FileFullPath: " + fileFullPath);
						File file = new File(fileFullPath);
						file.delete();
						result = new PluginResult(PluginResult.Status.OK);
					} catch (JSONException e) {
						e.printStackTrace();
						result = new PluginResult(PluginResult.Status.IO_EXCEPTION, e.getMessage());
					}
				}
			});
		} else if(action.equals("clearAllScreenshots")){
			result = null;
			super.cordova.getActivity().runOnUiThread(new Runnable() {
				@Override
				public void run() {
					String folderDirectory = Environment.getExternalStorageDirectory()+"/MobiiApp/Screenshots/";
					File dir = new File(folderDirectory);
					if(dir.exists()){
						File[] files = dir.listFiles();
						if(files != null){
							for(int i=0; i<files.length; i++){
								// LOG.d("Screenshot","File Name:" + i + files[i].getName());
								files[i].delete();
							}
						}
						
					}
					result = new PluginResult(PluginResult.Status.OK);
				}
			});
		} 

		// waiting ui thread to finish
		while (this.result == null) {
			try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				// ignoring exception, since we have to wait
				// ui thread to finish
			}
		}
		// LOG.d("Screenshot","Result Message" + this.result.getMessage());
		return this.result;
	}

}