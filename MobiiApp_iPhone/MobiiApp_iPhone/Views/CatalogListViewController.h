//
//  CatalogListViewController.h
//  MobiiApp_iPhone
//
//  Created by Fazhi Tu on 8/23/12.
//  Copyright (c) 2012 SMI. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "EGORefreshTableHeaderView.h"

@class SettingsViewController;

@interface CatalogListViewController : UITableViewController <EGORefreshTableHeaderDelegate>

@property (strong, nonatomic) NSArray *currentMobiiappCatalogs;
@property (strong, nonatomic) NSMutableArray *historyMobiiappCatalogs;
@property (strong, nonatomic) NSMutableArray *historyCatalogLabels;
@property (strong, nonatomic) UIBarButtonItem *catalogBackButtton;
@property (strong, nonatomic) UIBarButtonItem *settingsButton;
@property (nonatomic, assign) int currentLevel;

@property (strong, nonatomic) SettingsViewController *settingsView;


@end
