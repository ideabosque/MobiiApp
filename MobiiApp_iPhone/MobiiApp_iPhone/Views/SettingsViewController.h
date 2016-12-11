//
//  SettingsViewController.h
//  MobiiApp_iPhone
//
//  Created by Fazhi Tu on 8/25/12.
//  Copyright (c) 2012 SMI. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface SettingsViewController : UIViewController
@property (unsafe_unretained, nonatomic) IBOutlet UIButton *logoutButton;
- (IBAction)logoutMobiiApp:(id)sender;

@end
