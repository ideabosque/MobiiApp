//
//  Screenshot.h
//
//  Created by Simon Madine on 29/04/2010.
//  Copyright 2010 The Angry Robot Zombie Factory.
//   - Converted to Cordova 1.6.1 by Josemando Sobral.
//  MIT licensed
//
//  Modifications to support orientation change by @ffd8
//

#import "Screenshot.h"
#import "NSData+Base64.h"

@implementation Screenshot

@synthesize webView;

@synthesize callbackID;

- (void)saveScreenshot:(NSArray*)arguments withDict:(NSDictionary*)options
{
	CGRect imageRect;
	CGRect screenRect = [[UIScreen mainScreen] bounds];

	// statusBarOrientation is more reliable than UIDevice.orientation
	UIInterfaceOrientation orientation = [UIApplication sharedApplication].statusBarOrientation;

	if (orientation == UIInterfaceOrientationLandscapeLeft || orientation == UIInterfaceOrientationLandscapeRight) { 
		// landscape check
		imageRect = CGRectMake(0, 0, CGRectGetHeight(screenRect), CGRectGetWidth(screenRect));
	} else {
		// portrait check
		imageRect = CGRectMake(0, 0, CGRectGetWidth(screenRect), CGRectGetHeight(screenRect));
	}

	UIGraphicsBeginImageContext(imageRect.size);

	CGContextRef ctx = UIGraphicsGetCurrentContext();
	[[UIColor blackColor] set];
	CGContextTranslateCTM(ctx, 0, 0);
	CGContextFillRect(ctx, imageRect);

	[webView.layer renderInContext:ctx];

	UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
	UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil);
	UIGraphicsEndImageContext();

	UIAlertView *alert= [[UIAlertView alloc] initWithTitle:nil message:@"Image Saved" delegate:self cancelButtonTitle:@"OK" otherButtonTitles:nil];
	[alert show];
	[alert release];
}

- (void)saveScreenshotAsFile:(NSMutableArray*)arguments withDict:(NSDictionary*)options
{
	self.callbackID = [arguments pop];
	
	// NSUInteger argc = [arguments count];
	NSString *fileName = nil;		
    fileName = [arguments objectAtIndex:0];
    
    NSLog(@"File Name %@", fileName);
	
	// For error information
	NSError *error;
 
	// Create file manager
	NSFileManager *fileMgr = [NSFileManager defaultManager];
 
	// Point to Document directory
	NSString *documentsDirectory = [NSHomeDirectory() 
         	stringByAppendingPathComponent:@"Documents"];
	/*
	if (argc < 2) {
		NSLog(@"Screenshot.saveScreenshotAsFile: Not Enough Parameters.");
		return;
	} else {
		fileName = [arguments objectAtIndex:0];
		successCallback = [arguments objectAtIndex:1];
	}
	*/
	CGRect imageRect;
	CGRect screenRect = [[UIScreen mainScreen] bounds];

	// statusBarOrientation is more reliable than UIDevice.orientation
	UIInterfaceOrientation orientation = [UIApplication sharedApplication].statusBarOrientation;

	if (orientation == UIInterfaceOrientationLandscapeLeft || orientation == UIInterfaceOrientationLandscapeRight) { 
		// landscape check
		imageRect = CGRectMake(0, 0, CGRectGetHeight(screenRect), CGRectGetWidth(screenRect));
	} else {
		// portrait check
		imageRect = CGRectMake(0, 0, CGRectGetWidth(screenRect), CGRectGetHeight(screenRect));
	}

	UIGraphicsBeginImageContext(imageRect.size);

	CGContextRef ctx = UIGraphicsGetCurrentContext();
	[[UIColor blackColor] set];
	CGContextTranslateCTM(ctx, 0, 0);
	CGContextFillRect(ctx, imageRect);

	[webView.layer renderInContext:ctx];

	UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
	
	// UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil);
	UIGraphicsEndImageContext();
	
	// File we want to create in the documents directory 
	// Result is: /Documents/file1.txt
	NSString *filePath = [documentsDirectory 
         	stringByAppendingPathComponent:fileName];
	
	// Create plugin result
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus: CDVCommandStatus_OK 
		messageAsString: filePath];
	
 	
 	
	// Show contents of Documents directory
	NSLog(@"Documents directory: %@",
         	[fileMgr contentsOfDirectoryAtPath:documentsDirectory error:&error]);
         	
    // Show contents of Documents directory
	NSLog(@"File Path: %@",
         	filePath);
	
    [UIImagePNGRepresentation(image) writeToFile:filePath 
    	atomically:NO ];
    NSLog(@"File saved succssfully");
	[self writeJavascript: [pluginResult toSuccessCallbackString: self.callbackID]];
	/*
	if ( NO != YES) 
	{
		NSLog(@"Unable to save file: %@", error);
		[self writeJavascript: [pluginResult toErrorCallbackString: self.callbackID]];
	} else 
	{
		NSLog(@"File saved succssfully");
		[self writeJavascript: [pluginResult toSuccessCallbackString: self.callbackID]];
	}
	*/
}

- (void)deleteSavedScreenshotFile:(NSArray*)arguments withDict:(NSDictionary*)options
{
	// NSUInteger argc = [arguments count];
	NSString *fileName = nil;		
	
	// For error information
	NSError *error;
 
	// Create file manager
	NSFileManager *fileMgr = [NSFileManager defaultManager];
 
	// Point to Document directory
	NSString *documentsDirectory = [NSHomeDirectory() 
         	stringByAppendingPathComponent:@"Documents"];
         	
	fileName = [arguments objectAtIndex:0];
	
	// File we want to create in the documents directory 
	// Result is: /Documents/file1.txt
	NSString *filePath = [documentsDirectory 
         	stringByAppendingPathComponent:fileName];
 	
	// Show contents of Documents directory
	NSLog(@"Documents directory: %@",
         	[fileMgr contentsOfDirectoryAtPath:documentsDirectory error:&error]);
	
	// Attempt to delete the file at filePath2
	if ([fileMgr removeItemAtPath:filePath error:&error] != YES)
  			NSLog(@"Unable to delete file: %@", [error localizedDescription]);
 
	// Show contents of Documents directory
	NSLog(@"Documents directory: %@",
         	[fileMgr contentsOfDirectoryAtPath:documentsDirectory error:&error]);
}

- (void)clearAllScreenshots:(NSArray*)arguments withDict:(NSDictionary*)options
{
	NSString *extension = @"png";
	NSFileManager *fileManager = [NSFileManager defaultManager];
	
	// Point to Document directory
	NSString *documentsDirectory = [NSHomeDirectory() 
         	stringByAppendingPathComponent:@"Documents"];
	
	NSArray *contents = [fileManager contentsOfDirectoryAtPath:documentsDirectory error:NULL];  
	NSEnumerator *e = [contents objectEnumerator];
	NSString *filename;
	// Show contents of Documents directory
	NSLog(@"Documents directory before clear: %@",
         	[fileManager contentsOfDirectoryAtPath:documentsDirectory error:NULL]);
	while ((filename = [e nextObject])) {

    	if ([[filename pathExtension] isEqualToString:extension]) {

        	[fileManager removeItemAtPath:[documentsDirectory stringByAppendingPathComponent:filename] error:NULL];
    	}
	}
	// Show contents of Documents directory
	NSLog(@"Documents directory after clear: %@",
         	[fileManager contentsOfDirectoryAtPath:documentsDirectory error:NULL]);
}

- (void)saveImageDataToLibrary:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
	self.callbackID = arguments.pop;
	
	NSData* imageData = [NSData dataFromBase64String:arguments.pop];
	
	UIImage* image = [[[UIImage alloc] initWithData:imageData] autorelease];	
	UIImageWriteToSavedPhotosAlbum(image, self, @selector(image:didFinishSavingWithError:contextInfo:), nil);
	
}

- (void)image:(UIImage *)image didFinishSavingWithError:(NSError *)error contextInfo:(void *)contextInfo
{
    // Was there an error?
    if (error != NULL)
    {
        // Show error message...
        NSLog(@"ERROR: %@",error);
#ifdef PHONEGAP_FRAMEWORK
		PluginResult* result = [PluginResult resultWithStatus: PGCommandStatus_ERROR messageAsString:error.description];
#endif
#ifdef CORDOVA_FRAMEWORK
		CDVPluginResult* result = [CDVPluginResult resultWithStatus: CDVCommandStatus_ERROR messageAsString:error.description];
#endif
		[self.webView stringByEvaluatingJavaScriptFromString:[result toSuccessCallbackString: self.callbackID]];
    }
    else  // No errors
    {
        // Show message image successfully saved
        NSLog(@"IMAGE SAVED!");
#ifdef PHONEGAP_FRAMEWORK
		PluginResult* result = [PluginResult resultWithStatus: PGCommandStatus_OK messageAsString:@"Image saved"];
#endif
#ifdef CORDOVA_FRAMEWORK
		CDVPluginResult* result = [CDVPluginResult resultWithStatus: CDVCommandStatus_OK messageAsString:@"Image saved"];
#endif
		[self.webView stringByEvaluatingJavaScriptFromString:[result toSuccessCallbackString: self.callbackID]];
    }
}

- (void)saveImageDataToFile:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    self.callbackID = [arguments pop];
	
	NSUInteger argc = [arguments count];
	NSString* fileName = nil;
    NSData* imageData = nil;
    
    if (argc < 2) {
		NSLog(@"Screenshot.saveImageDataToFile: Not Enough Parameters.");
		return;
	} else {
		fileName = [arguments objectAtIndex:0];
        imageData = [NSData dataFromBase64String:[arguments objectAtIndex:1]];
	}
    
    NSLog(@"File Name %@", fileName);
	
	// For error information
	NSError *error;
    
	// Create file manager
	NSFileManager *fileMgr = [NSFileManager defaultManager];
    
	// Point to Document directory
	NSString *documentsDirectory = [NSHomeDirectory() 
                                    stringByAppendingPathComponent:@"Documents"];
	
	
	
	UIImage* image = [[[UIImage alloc] initWithData:imageData] autorelease];
    
    // File we want to create in the documents directory 
	NSString *filePath = [documentsDirectory 
                          stringByAppendingPathComponent:fileName];
	
	// Create plugin result
	CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus: CDVCommandStatus_OK 
                                                    messageAsString: filePath];
	
 	
    // Show contents of Documents directory
	NSLog(@"Documents directory: %@",
          [fileMgr contentsOfDirectoryAtPath:documentsDirectory error:&error]);
    
    // Show contents of Documents directory
	NSLog(@"File Path: %@",
          filePath);
	
    [UIImagePNGRepresentation(image) writeToFile:filePath 
                                      atomically:NO ];
    NSLog(@"File saved succssfully");
	
    [self writeJavascript: [pluginResult toSuccessCallbackString: self.callbackID]];
    /*
    
    // Was there an error?
    if (error != NULL)
    {
        // Show error message...
        NSLog(@"ERROR: %@",error);
#ifdef PHONEGAP_FRAMEWORK
		PluginResult* result = [PluginResult resultWithStatus: PGCommandStatus_ERROR messageAsString:error.description];
#endif
#ifdef CORDOVA_FRAMEWORK
		CDVPluginResult* result = [CDVPluginResult resultWithStatus: CDVCommandStatus_ERROR messageAsString:error.description];
#endif
		[self.webView stringByEvaluatingJavaScriptFromString:[result toSuccessCallbackString: self.callbackID]];
    }
    else  // No errors
    {
        // Show message image successfully saved
        NSLog(@"IMAGE SAVED!");
#ifdef PHONEGAP_FRAMEWORK
		PluginResult* result = [PluginResult resultWithStatus: PGCommandStatus_OK messageAsString:@"Image saved"];
#endif
#ifdef CORDOVA_FRAMEWORK
		CDVPluginResult* result = [CDVPluginResult resultWithStatus: CDVCommandStatus_OK messageAsString:@"Image saved"];
#endif
		[self.webView stringByEvaluatingJavaScriptFromString:[result toSuccessCallbackString: self.callbackID]];
    }
    */
    
}

- (void)dealloc
{	
	[callbackID release];
    [super dealloc];
}

@end