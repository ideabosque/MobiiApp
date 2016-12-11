//
//  LoginViewController.h
//  MobiiApp_iPhone
//
//  Created by Fazhi Tu on 8/22/12.
//  Copyright (c) 2012 SMI. All rights reserved.
//

#import <UIKit/UIKit.h>

@class CatalogListViewController;

@interface LoginViewController : UIViewController <UITextFieldDelegate, UIAlertViewDelegate>

@property (strong, nonatomic) UITextField *usernameField;
@property (strong, nonatomic) UITextField *passwordField;
@property (strong, nonatomic) UITextField *serverurlField;
@property (strong, nonatomic) UIButton *loginButton;

@property (strong, nonatomic) CatalogListViewController *catalogListVC;


@end
