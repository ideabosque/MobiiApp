//
//  LoginViewController.m
//  MobiiApp_iPhone
//
//  Created by Fazhi Tu on 8/22/12.
//  Copyright (c) 2012 SMI. All rights reserved.
//

#import "LoginViewController.h"
#import "MobiiAppCatalog.h"
#import "CatalogListViewController.h"

@interface LoginViewController ()

@end

@implementation LoginViewController{
   
}

@synthesize usernameField = _usernameField;
@synthesize passwordField = _passwordField;
@synthesize serverurlField = _serverurlField;
@synthesize loginButton = _loginButton;

@synthesize catalogListVC = _catalogListVC;


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
    
	// Do any additional setup after loading the view.
    // Set View background color.
    self.view.backgroundColor = [UIColor colorWithRed:123.0/255.0 green:180.0/255.0 blue:210.0/155.0 alpha:1.0];
    self.navigationController.navigationBar.tintColor = [UIColor colorWithRed:123.0/255.0 green:180.0/255.0 blue:210.0/155.0 alpha:1.0];
    // Add logo
    CGRect logoImageViewFrame = CGRectMake(0, 10, self.view.bounds.size.width, 100.0);
    
    UIImage *logoImage = [UIImage imageNamed:@"mobiiapp_beta_logo.png"];
    UIImageView *logoImageView = [[UIImageView alloc] initWithFrame:logoImageViewFrame];
    logoImageView.image = logoImage;
    logoImageView.contentMode = UIViewContentModeCenter;
    
    [self.view addSubview:logoImageView];
    
    // Add User Name Field
    float usernameY = logoImageViewFrame.origin.y + logoImageViewFrame.size.height + 10.0;
    
    CGRect usernameLabelFrame = CGRectMake(10, usernameY, 100.0, 31.0f);
    
    UILabel *usernameLabel = [[UILabel alloc] initWithFrame:usernameLabelFrame];
    usernameLabel.text = @"Name";
    usernameLabel.backgroundColor = [UIColor clearColor];
    usernameLabel.textAlignment = UITextAlignmentRight;
    [self.view addSubview:usernameLabel];
    
    CGRect usernameFieldFrame = CGRectMake(usernameLabelFrame.origin.x + usernameLabelFrame.size.width + 10.0, usernameY, 180.0, 31.0);
    
    _usernameField = [[UITextField alloc] initWithFrame:usernameFieldFrame];
    _usernameField.backgroundColor = [UIColor whiteColor];
    _usernameField.borderStyle = UITextBorderStyleRoundedRect;
    _usernameField.contentVerticalAlignment = UIControlContentVerticalAlignmentCenter;
    _usernameField.delegate = self;
    _usernameField.autocapitalizationType = UITextAutocapitalizationTypeNone;
    _usernameField.clearButtonMode = UITextFieldViewModeWhileEditing;
    
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    
    NSString *savedUsername = (NSString *)[userDefaults objectForKey:@"MobiiAppUsername"];
    NSString *savedPassword = (NSString *)[userDefaults objectForKey:@"MobiiAppPassword"];
    NSString *savedToken = (NSString *)[userDefaults objectForKey:@"MobiiAppToken"];
    NSString *savedServerurl = (NSString *)[userDefaults objectForKey:@"MobiiAppServerurl"];
    
    if (savedUsername) {
        _usernameField.text = savedUsername;
    }
    
    [self.view addSubview:_usernameField];
    
    // Add Password Name Field
    float passwordY = usernameLabelFrame.origin.y + usernameLabelFrame.size.height + 10.0;
    
    CGRect passwordLabelFrame = CGRectMake(10, passwordY, 100.0, 31.0f);
    
    UILabel *passwordLabel = [[UILabel alloc] initWithFrame:passwordLabelFrame];
    passwordLabel.text = @"Password";
    passwordLabel.backgroundColor = [UIColor clearColor];
    passwordLabel.textAlignment = UITextAlignmentRight;
    [self.view addSubview:passwordLabel];
    
    CGRect passwordFieldFrame = CGRectMake(passwordLabelFrame.origin.x + passwordLabelFrame.size.width + 10.0, passwordY, 180.0, 31.0);
    
    _passwordField = [[UITextField alloc] initWithFrame:passwordFieldFrame];
    _passwordField.backgroundColor = [UIColor whiteColor];
    _passwordField.borderStyle = UITextBorderStyleRoundedRect;
    _passwordField.contentVerticalAlignment = UIControlContentVerticalAlignmentCenter;
    _passwordField.secureTextEntry = YES;
    _passwordField.delegate = self;
    _passwordField.clearButtonMode = UITextFieldViewModeWhileEditing;
    
    if (savedPassword) {
        _passwordField.text = savedPassword;
    }
    
    [self.view addSubview:_passwordField];
    
    // Add Server URL Field
    float serverurlY = passwordLabelFrame.origin.y + passwordLabelFrame.size.height + 15.0;
    
    CGRect serverurlLabelFrame = CGRectMake(10, serverurlY, 100.0, 31.0f);
    CGRect serverurlFieldFrame = CGRectMake(10, serverurlY, 290, 31.0f);
    _serverurlField = [[UITextField alloc] initWithFrame:serverurlFieldFrame];
    _serverurlField.backgroundColor = [UIColor whiteColor];
    _serverurlField.borderStyle = UITextBorderStyleRoundedRect;
    _serverurlField.contentVerticalAlignment = UIControlContentVerticalAlignmentCenter;
    _serverurlField.delegate = self;
    _serverurlField.autocapitalizationType = UITextAutocapitalizationTypeNone;
    _serverurlField.clearButtonMode = UITextFieldViewModeWhileEditing;
    _serverurlField.placeholder = @"Server";
    
    if (savedServerurl) {
        _serverurlField.text = savedServerurl;
    } else {
        _serverurlField.text = @"https://www.mobiiapp.com";
    }
    
    [self.view addSubview:_serverurlField];
    
    // Add Offline Switch
    float offlineY = serverurlLabelFrame.origin.y + serverurlLabelFrame.size.height + 10.0;
    
    CGRect offlineLabelFrame = CGRectMake(10, offlineY, 100.0, 31.0f);
    // Add Login Button
    float loginButtonY = offlineLabelFrame.origin.y + offlineLabelFrame.size.height + 20.0;
        
    CGRect loginButtonFrame = CGRectMake(10, loginButtonY, 300.0, 37.0);
    
    _loginButton = [UIButton buttonWithType:UIButtonTypeRoundedRect];
    _loginButton.frame = loginButtonFrame;
    [_loginButton setTitle:@"Login" forState:UIControlStateNormal];
    
    [_loginButton addTarget:self 
                     action:@selector(loginMobiiApp) 
           forControlEvents:UIControlEventTouchUpInside];
    
    [self.view addSubview:_loginButton];
    
    if (savedUsername != nil &&
        savedPassword != nil &&
        savedToken != nil &&
        savedServerurl != nil) {
        //Login automatically with save username and password
        [self loginMobiiApp];
    }
}

- (void)viewWillAppear:(BOOL)animated
{
    [self.navigationController setNavigationBarHidden:YES];
    [super viewWillAppear:animated];
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    self.usernameField = nil;
    self.passwordField = nil;
    self.serverurlField = nil;
    self.loginButton = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
    // NSLog(@"touchesBegan:withEvent");
    [self.view endEditing:YES];
    [super touchesBegan:touches withEvent:event];
}

#pragma mark UITextField Delegate
- (BOOL)textFieldShouldBeginEditing:(UITextField *)textField
{
    return YES;
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
    NSLog(@"textFieldShouldReturn");
    [textField resignFirstResponder];
    return YES;
}

- (BOOL)textFieldShouldClear:(UITextField *)textField
{
    NSLog(@"textFieldShouldClear");
    return YES;
}

- (BOOL)textFieldShouldEndEditing:(UITextField *)textField
{
    // textField.backgroundColor = [UIColor whiteColor];
    return YES;
}

#pragma mark loginMobiiApp
- (void)loginMobiiApp
{
    NSLog(@"Login Button is Tapped");
    
    UIActivityIndicatorView *progressView = [[UIActivityIndicatorView alloc] 
                                             initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
    progressView.hidesWhenStopped = YES;
    
    UIAlertView *alertView = [[UIAlertView alloc] 
                              initWithTitle:@"Login" 
                              message:@"\n\n" 
                              delegate:self 
                              cancelButtonTitle: nil
                              // cancelButtonTitle:@"Cancel" 
                              otherButtonTitles:nil, nil];
    
    NSString *username = _usernameField.text;
    NSString *password = _passwordField.text;
    NSString *serverurl = _serverurlField.text;
    
    NSArray *temp = [serverurl componentsSeparatedByString:@"/"];
    
    if (username == nil || password == nil || serverurl == nil) {
        NSLog(@"User name, password and server url are required!");
        [alertView setMessage:@"User name, password and server url are required!"];
        [alertView addButtonWithTitle:@"Cancel"];
        [alertView show];
    } else if ([temp count] <3){
        [alertView setMessage:@"Server URL is not correct!\n It should simialar as https:\\\\www.mobiiapp.com"];
        [alertView addButtonWithTitle:@"Cancel"];
        [alertView show];
    } else {
        [alertView show];
        progressView.center = CGPointMake(alertView.bounds.size.width / 2, alertView.bounds.size.height - 80);
        
        [alertView addSubview:progressView];
        [progressView startAnimating];
        
        NSString *serverurlAsString = [serverurl stringByAppendingFormat:@"%@",@"/client/login/"];
        
        NSURL *requestURL = [NSURL URLWithString:serverurlAsString];
        NSMutableURLRequest *loginRequest = [NSMutableURLRequest requestWithURL:requestURL cachePolicy:NSURLRequestReloadIgnoringLocalCacheData timeoutInterval:10.0f];
        
        [loginRequest setHTTPMethod:@"POST"];
        NSString *body = [NSString stringWithFormat:@"username=%@&password=%@",username,password];
        [loginRequest setHTTPBody:[body dataUsingEncoding:NSUTF8StringEncoding]];
        
        NSOperationQueue *loginQueue = [[NSOperationQueue alloc] init];
        [NSURLConnection 
         sendAsynchronousRequest:loginRequest 
         queue:loginQueue 
         completionHandler:^(NSURLResponse *response, NSData *data, NSError *error) {
             if ([data length] >0 && error == nil) {
                 // Successfully talked with server
                 NSDictionary *responseDictionary = [NSJSONSerialization
                                                     JSONObjectWithData:data 
                                                     options:kNilOptions 
                                                     error:&error];
                 
                 NSNumber *isSuccessNumber = (NSNumber *)[responseDictionary objectForKey:@"success"];
                 
                 if (isSuccessNumber && [isSuccessNumber boolValue] == YES) {
                     NSLog(@"Login Successfully");
                     
                     NSString *ptoken = (NSString *)[responseDictionary objectForKey:@"ptoken"];
                     NSString *userperm = (NSString *)[responseDictionary objectForKey:@"userperm"];
                     
                     NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
                     
                     [defaults setObject:username forKey:@"MobiiAppUsername"];
                     [defaults setObject:password forKey:@"MobiiAppPassword"];
                     [defaults setObject:serverurl forKey:@"MobiiAppServerurl"];
                     [defaults setObject:ptoken forKey:@"MobiiAppToken"];
                     [defaults setObject:userperm forKey:@"MobiiAppUserperm"];
                     
                     dispatch_async(dispatch_get_main_queue(), ^{
                         [alertView dismissWithClickedButtonIndex:0 animated:YES];
                         _catalogListVC = [[CatalogListViewController alloc] initWithStyle:UITableViewStylePlain];
                         
                         [self.navigationController pushViewController:_catalogListVC animated:YES];
                     });
                 } else {
                     NSLog(@"Error while login");
                     NSString *errorMessage = (NSString *)[responseDictionary objectForKey:@"errorMessage"];
                     dispatch_async(dispatch_get_main_queue(), ^{
                         [progressView stopAnimating];
                         [alertView setTitle:@"Login Error"];
                         [alertView setMessage:errorMessage];
                         [alertView performSelector:@selector(dismissWithClickedButtonIndex:animated:) withObject:nil afterDelay:1.0f];
                     });
                 }
                 
                 
                 
             } else if([data length] == 0 && error == nil ){
                 // No return from server
                 NSLog(@"No return from server");
                 dispatch_async(dispatch_get_main_queue(), ^{
                     [progressView stopAnimating];
                     [alertView setTitle:@"Login Error"];
                     [alertView setMessage:@"No result return from server!"];
                     [alertView performSelector:@selector(dismissWithClickedButtonIndex:animated:) withObject:nil afterDelay:1.0f];
                 });
             } else {
                 // Error while talk to server
                 NSLog(@"Error while talking to server, Error = %@",error);
                 dispatch_async(dispatch_get_main_queue(), ^{
                     [progressView stopAnimating];
                     [alertView setTitle:@"Connection Error"];
                     [alertView setMessage:@"Error while connect to the server!"];
                     [alertView performSelector:@selector(dismissWithClickedButtonIndex:animated:) withObject:nil afterDelay:1.0f];
                 });
             }
         }];
        
    }
    
}

@end
