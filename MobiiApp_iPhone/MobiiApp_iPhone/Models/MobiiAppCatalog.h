//
//  MobiiAppCatalog.h
//  MobiiApp_iPhone
//
//  Created by Fazhi Tu on 8/23/12.
//  Copyright (c) 2012 SMI. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface MobiiAppCatalog : NSObject <NSCopying>

@property (strong, nonatomic) NSString *catalogLabel;
@property (strong, nonatomic) NSString *catalogId;
@property (strong, nonatomic) NSString *controlId;
@property (strong, nonatomic) NSString *controller;
@property (strong, nonatomic) NSString *type;
@property (assign, nonatomic) BOOL leaf;
@property (strong, nonatomic) NSArray *items;

- (id)initWithCatalogId:(NSString *)inCatalogId 
        andCatalogLabel: (NSString *)inCatalogLabel 
           andControlId: (NSString *)inControlId 
          andController: (NSString *)inController 
                andType: (NSString *)inType 
                andLeaf: (BOOL )inLeaf 
               andItems: (NSArray *)inItems;

+ (NSArray *)retrieveCatalogs;
+ (NSArray *) generateCatalogsWithItems:(NSArray *)items;

@end
