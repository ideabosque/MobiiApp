//
//  Screenshot.h
//
//  Created by Simon Madine on 29/04/2010.
//  Copyright 2010 The Angry Robot Zombie Factory.
//   - Converted to Cordova 1.6.1 by Josemando Sobral.
//  MIT licensed
//

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

#ifdef CORDOVA_FRAMEWORK
    #import <Cordova/CDVPlugin.h>
#else
    #import "CDVPlugin.h"
#endif

@interface Screenshot : CDVPlugin {
	NSString* callbackID;
}

@property (nonatomic, copy) NSString* callbackID;

- (void)saveScreenshot:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)saveScreenshotAsFile:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)deleteSavedScreenshotFile:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)clearAllScreenshots:(NSArray*)arguments withDict:(NSDictionary*)options;
- (void)saveImageDataToFile:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
- (void)saveImageDataToLibrary:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

@end