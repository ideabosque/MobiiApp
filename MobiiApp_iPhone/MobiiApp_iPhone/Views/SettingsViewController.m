//
//  SettingsViewController.m
//  MobiiApp_iPhone
//
//  Created by Fazhi Tu on 8/25/12.
//  Copyright (c) 2012 SMI. All rights reserved.
//

#import "SettingsViewController.h"
#import "LoginViewController.h"

@interface SettingsViewController ()

@end

@implementation SettingsViewController
@synthesize logoutButton;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    // Do any additional setup after loading the view from its nib.
    self.title = @"Settings";
    // self.logoutButton.backgroundColor = [UIColor redColor];
}

- (void)viewDidUnload
{
    [self setLogoutButton:nil];
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}

- (IBAction)logoutMobiiApp:(id)sender {
    // NSArray *viewControllers = self.navigationController.viewControllers;
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    
    NSString *savedUsername = (NSString *)[userDefaults objectForKey:@"MobiiAppUsername"];
    NSString *savedPassword = (NSString *)[userDefaults objectForKey:@"MobiiAppPassword"];
    // NSString *savedToken = (NSString *)[userDefaults objectForKey:@"MobiiAppToken"];
    NSString *savedServerurl = (NSString *)[userDefaults objectForKey:@"MobiiAppServerurl"];
    
    NSString *serverurlAsString = [savedServerurl stringByAppendingFormat:@"%@",@"/client/logout/"];
    
    NSURL *requestURL = [NSURL URLWithString:serverurlAsString];
    NSMutableURLRequest *logoutRequest = [NSMutableURLRequest 
                                         requestWithURL:requestURL 
                                         cachePolicy:NSURLRequestReloadIgnoringLocalCacheData 
                                         timeoutInterval:10.0f];
    
    [logoutRequest setHTTPMethod:@"POST"];
    NSString *body = [NSString stringWithFormat:@"username=%@&password=%@",savedUsername,savedPassword];
    [logoutRequest setHTTPBody:[body dataUsingEncoding:NSUTF8StringEncoding]];
    
    NSOperationQueue *logoutQueue = [[NSOperationQueue alloc] init];
    
    [NSURLConnection
     sendAsynchronousRequest:logoutRequest queue:logoutQueue completionHandler:^(NSURLResponse *response, NSData *data, NSError *error) {
         NSLog(@"Logout return data: %@",[[NSString alloc] 
                                          initWithData:data 
                                          encoding:NSUTF8StringEncoding]);
         [userDefaults removeObjectForKey:@"MobiiAppUsername"];
         [userDefaults removeObjectForKey:@"MobiiAppPassword"];
         [userDefaults removeObjectForKey:@"MobiiAppServerurl"];
         [userDefaults removeObjectForKey:@"MobiiAppToken"];
     }];
    
    
    NSMutableArray *viewControllers = [[NSMutableArray alloc]init];
    __block LoginViewController *loginView = nil;
   [self.navigationController.viewControllers enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
       NSLog(@"Index: %d, Obj: %@",idx, obj);
       if ([obj isKindOfClass:[LoginViewController class]]) {
           NSLog(@"Yes, I am. Index is: %d",idx);
           loginView = (LoginViewController *)obj;
           loginView.usernameField.text = nil;
           loginView.passwordField.text = nil;
           loginView.serverurlField.text = nil;
           [viewControllers addObject:obj];
       }
   }];
    
    [self.navigationController setViewControllers:viewControllers animated:YES];
}
@end
