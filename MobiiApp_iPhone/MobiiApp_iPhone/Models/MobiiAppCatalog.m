//
//  MobiiAppCatalog.m
//  MobiiApp_iPhone
//
//  Created by Fazhi Tu on 8/23/12.
//  Copyright (c) 2012 SMI. All rights reserved.
//

#import "MobiiAppCatalog.h"

@implementation MobiiAppCatalog

@synthesize catalogLabel;
@synthesize catalogId;
@synthesize controlId;
@synthesize controller;
@synthesize type;
@synthesize leaf;
@synthesize items;

- (id)copyWithZone:(NSZone *)zone
{
    MobiiAppCatalog *newCatalog = [MobiiAppCatalog new];
    [newCatalog setCatalogId:self.controlId];
    [newCatalog setCatalogLabel:self.catalogLabel];
    [newCatalog setControlId:self.controlId];
    [newCatalog setController:self.controller];
    [newCatalog setType:self.type];
    [newCatalog setLeaf:self.leaf];
    [newCatalog setItems:self.items];
    return newCatalog;
}

- (id)initWithCatalogId:(NSString *)inCatalogId 
        andCatalogLabel: (NSString *)inCatalogLabel 
           andControlId: (NSString *)inControlId 
          andController: (NSString *)inController 
                andType: (NSString *)inType 
                andLeaf: (BOOL )inLeaf 
               andItems: (NSArray *)inItems
{
    if (self = [self init]) {
        self.catalogId = inCatalogId;
        self.catalogLabel = inCatalogLabel;
        self.controlId = inControlId;
        self.controller = inController;
        self.type = inType;
        self.leaf = inLeaf;
        self.items = inItems;
    }
    return self;
}

+ (NSArray *)retrieveCatalogs
{
    NSMutableArray *catalogs = [[NSMutableArray alloc] init ];
    
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    
    NSString *baseUrl = (NSString *)[userDefaults objectForKey:@"MobiiAppServerurl"];
    NSString *username = (NSString *)[userDefaults objectForKey:@"MobiiAppUsername"];
    NSString *password = (NSString *)[userDefaults objectForKey:@"MobiiAppPassword"];
    NSString *loadMenuUrl = [baseUrl stringByAppendingFormat:@"%@",@"/client/loadmenu/"];
    
    NSMutableURLRequest *loadMenuRequest = [NSMutableURLRequest 
                                            requestWithURL:[NSURL URLWithString:loadMenuUrl]];
    
    [loadMenuRequest setHTTPMethod:@"POST"];
    NSString *body = [NSString stringWithFormat:@"username=%@&password=%@",username,password];
    [loadMenuRequest setHTTPBody:[body dataUsingEncoding:NSUTF8StringEncoding]];
    
    NSURLResponse *response = nil;
    NSError *error = nil;
    
    NSData *data = [NSURLConnection 
                    sendSynchronousRequest:loadMenuRequest 
                    returningResponse:&response 
                    error:&error];
    if ([data length] >0 && error == nil) {
        // NSLog(@"Return Data: %@",[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
        NSDictionary *responseDictionary = [NSJSONSerialization
                                            JSONObjectWithData:data 
                                            options:kNilOptions 
                                            error:&error];
        
        NSArray *items = (NSArray *)[responseDictionary objectForKey:@"items"];
        catalogs = [[self generateCatalogsWithItems:items] mutableCopy];
        
    } else if ([data length] == 0 && error == nil) {
        NSLog(@"No data loaded");
    } else {
        NSLog(@"Error while load menu, Error = %@",error);
    }
    
    return [catalogs copy];
}

+ (NSArray *) generateCatalogsWithItems:(NSArray *)items
{
    NSMutableArray *catalogs = [[NSMutableArray alloc]init ];
    
    [items enumerateObjectsUsingBlock:^(NSDictionary *obj, NSUInteger idx, BOOL *stop) {
        MobiiAppCatalog *catalog = [[MobiiAppCatalog alloc] init];
        [catalog setCatalogId:(NSString *)[obj objectForKey:@"id"]];
        [catalog setCatalogLabel:(NSString *)[obj objectForKey:@"label"]];
        [catalog setControlId:(NSString *)[obj objectForKey:@"control_id"]];
        [catalog setController:(NSString *)[obj objectForKey:@"controller"]];
        [catalog setType:(NSString *)[obj objectForKey:@"type"]];
        [catalog setLeaf:[(NSNumber *)[obj objectForKey:@"leaf"] boolValue]];
        [catalog setItems:(NSArray *)[obj objectForKey:@"items"]];
        [catalogs addObject:catalog];
    }];
    
    return [catalogs copy];
}

@end
