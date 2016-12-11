//
//  CatalogListViewController.m
//  MobiiApp_iPhone
//
//  Created by Fazhi Tu on 8/23/12.
//  Copyright (c) 2012 SMI. All rights reserved.
//

#import "CatalogListViewController.h"
#import "MobiiAppCatalog.h"
#import "EGORefreshTableHeaderView.h"
#import "SettingsViewController.h"

@interface CatalogListViewController ()

@end

@implementation CatalogListViewController{
    EGORefreshTableHeaderView *pull;
    BOOL reloading;
}

@synthesize currentMobiiappCatalogs = _currentMobiiappCatalogs;
@synthesize historyMobiiappCatalogs = _historyMobiiappCatalogs;
@synthesize historyCatalogLabels = _historyCatalogLabels;
@synthesize catalogBackButtton = _catalogBackButtton;
@synthesize settingsButton = _settingsButton;
@synthesize currentLevel = _currentLevel;
@synthesize settingsView = _settingsView;


- (id)initWithStyle:(UITableViewStyle)style
{
    self = [super initWithStyle:style];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewWillAppear:(BOOL)animated
{
    [self.navigationController setNavigationBarHidden:NO];
    [self.navigationItem setHidesBackButton:YES];
    [super viewWillAppear:animated];
}

- (void)viewDidLoad
{
    [super viewDidLoad];

    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
 
    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
    self.navigationItem.title = @"Home";
    // self.view.backgroundColor = [UIColor blackColor];
    // self.navigationController.navigationBar.tintColor = [UIColor blackColor];
    // self.tableView.separatorColor = [UIColor clearColor];
    UIActivityIndicatorView *loadingIndicator = [[UIActivityIndicatorView alloc] initWithFrame:CGRectMake(0, 0, 25, 25)];
    
    [loadingIndicator sizeToFit];
    loadingIndicator.autoresizingMask = (UIViewAutoresizingFlexibleBottomMargin |
                                         UIViewAutoresizingFlexibleLeftMargin |
                                         UIViewAutoresizingFlexibleRightMargin |
                                         UIViewAutoresizingFlexibleTopMargin);
    UIBarButtonItem *loadingView = [[UIBarButtonItem alloc] initWithCustomView:loadingIndicator];
    
    [self.navigationItem setLeftBarButtonItem:loadingView];
    [loadingIndicator startAnimating]; 
    UIButton *sButton = [UIButton buttonWithType:UIButtonTypeCustom]; 
    [sButton setBackgroundImage:[UIImage imageNamed:@"settings_white.png"] forState:UIControlStateNormal];
    [sButton addTarget:self action:@selector(performSettings) forControlEvents:UIControlEventTouchUpInside];
    sButton.frame = CGRectMake(0, 0, 25.0f, 25.0f);
    self.settingsButton = [[UIBarButtonItem alloc] initWithCustomView:sButton];
    
    /* Add pull to refresh view */
    pull = [[EGORefreshTableHeaderView alloc] initWithFrame:CGRectMake(0, 0-self.tableView.bounds.size.height, self.view.frame.size.width, self.view.frame.size.height)];
    pull.delegate = self;
    [self.tableView addSubview:pull];
    
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        self.currentMobiiappCatalogs = [[MobiiAppCatalog retrieveCatalogs] mutableCopy];
        self.historyMobiiappCatalogs = [NSMutableArray new];
        self.historyCatalogLabels = [NSMutableArray new];
        dispatch_async(dispatch_get_main_queue(), ^{
            [self.tableView reloadData];
            self.currentLevel = 0;
            [loadingIndicator stopAnimating];
            [self.navigationItem setLeftBarButtonItem:nil];
            [self.navigationItem setRightBarButtonItem:self.settingsButton];
        });
    });
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
    self.currentMobiiappCatalogs = nil;
    self.historyMobiiappCatalogs = nil; 
    self.historyCatalogLabels = nil;
    self.currentLevel = 0;
    self.catalogBackButtton = nil;
    pull = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return [self.currentMobiiappCatalogs count];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *CellIdentifier = @"Cell";
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CellIdentifier];
    
    // Configure the cell...
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:CellIdentifier];
        
    }
    NSString *catalogLabel = [[self.currentMobiiappCatalogs objectAtIndex: indexPath.row] catalogLabel];
    cell.textLabel.text = catalogLabel;
    cell.textLabel.numberOfLines = 0;
    cell.accessoryType = UITableViewCellAccessoryDetailDisclosureButton;
    
    return cell; 
}

/*
// Override to support conditional editing of the table view.
- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Return NO if you do not want the specified item to be editable.
    return YES;
}
*/

/*
// Override to support editing the table view.
- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (editingStyle == UITableViewCellEditingStyleDelete) {
        // Delete the row from the data source
        [tableView deleteRowsAtIndexPaths:[NSArray arrayWithObject:indexPath] withRowAnimation:UITableViewRowAnimationFade];
    }   
    else if (editingStyle == UITableViewCellEditingStyleInsert) {
        // Create a new instance of the appropriate class, insert it into the array, and add a new row to the table view
    }   
}
*/

/*
// Override to support rearranging the table view.
- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)fromIndexPath toIndexPath:(NSIndexPath *)toIndexPath
{
}
*/

/*
// Override to support conditional rearranging of the table view.
- (BOOL)tableView:(UITableView *)tableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Return NO if you do not want the item to be re-orderable.
    return YES;
}
*/

#pragma mark - Table view delegate

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Navigation logic may go here. Create and push another view controller.
    /*
     <#DetailViewController#> *detailViewController = [[<#DetailViewController#> alloc] initWithNibName:@"<#Nib name#>" bundle:nil];
     // ...
     // Pass the selected object to the new view controller.
     [self.navigationController pushViewController:detailViewController animated:YES];
     */
    MobiiAppCatalog *catalog = [self.currentMobiiappCatalogs objectAtIndex:indexPath.row];
    if ([catalog.type isEqualToString:@"folder"]) {
        NSArray *items = catalog.items;
        [self.historyMobiiappCatalogs addObject:self.currentMobiiappCatalogs];
        [self.historyCatalogLabels addObject:self.navigationItem.title];
        self.currentMobiiappCatalogs = [MobiiAppCatalog generateCatalogsWithItems:items];
        [tableView reloadData];
        [self.navigationItem setTitle:catalog.catalogLabel];
        self.currentLevel++;
        if (self.catalogBackButtton == nil) {
            UIButton *backButton = [UIButton buttonWithType:UIButtonTypeCustom];
            [backButton setBackgroundImage:[UIImage imageNamed:@"arrow_left_white"] forState:UIControlStateNormal];
            [backButton addTarget:self action:@selector(performCatalogBack) forControlEvents:UIControlEventTouchUpInside];
            backButton.frame = CGRectMake(0, 0, 25.0f, 25.0f);
            // [backButton setTitle:@"Back" forState:UIControlStateNormal];
            self.catalogBackButtton = [[UIBarButtonItem alloc] initWithCustomView:backButton];
            [self.navigationItem setLeftBarButtonItem:self.catalogBackButtton];
        }
        [self.navigationItem setRightBarButtonItem:nil];
        
    } else {
        /*
        NSLog(@"Selected Catalog: %@",catalog);
        NSLog(@"Catalog ID: %@",catalog.catalogId);
        NSLog(@"Catalog Label: %@",catalog.catalogLabel);
        NSLog(@"Catalog Control ID: %@",catalog.controlId);
        NSLog(@"Catalog Controller: %@",catalog.controller);
        NSLog(@"Catalog Type: %@",catalog.type);
        NSLog(@"Catalog Leaf: %d",catalog.leaf);
        NSLog(@"Catalog Items: %@",catalog.items);
         */
    }
}

- (void)performCatalogBack
{
    
    self.currentMobiiappCatalogs = [self.historyMobiiappCatalogs lastObject];
    NSString *label = [self.historyCatalogLabels lastObject];
    [self.tableView reloadData];
    [self.navigationItem setTitle:label];
    [self.historyMobiiappCatalogs removeLastObject];
    [self.historyCatalogLabels removeLastObject];
    self.currentLevel--;
    if (self.currentLevel == 0) {
        [self.navigationItem setLeftBarButtonItem:nil];
        self.catalogBackButtton = nil;
        // [self.navigationItem setTitle:@"Home"];
        [self.navigationItem setRightBarButtonItem:self.settingsButton];
    }
}

#pragma mark performSettings
- (void)performSettings
{
    _settingsView = [[SettingsViewController alloc] initWithNibName:@"SettingsViewController" bundle:NULL];
    [self.navigationController pushViewController:_settingsView animated:YES];
}

#pragma mark reload catalog data from server
- (void)reloadMobiiAppCatalogsFromServer
{
    reloading = YES;
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        self.currentMobiiappCatalogs = [[MobiiAppCatalog retrieveCatalogs] mutableCopy];
        _historyMobiiappCatalogs = [NSMutableArray new];
        _historyCatalogLabels = [NSMutableArray new];
        dispatch_async(dispatch_get_main_queue(), ^{
            [self doneReloadingMobiiAppCatalogsFromServer];
            [self.tableView reloadData];
        });
    });
}

- (void) doneReloadingMobiiAppCatalogsFromServer
{
    reloading = NO;
    [pull egoRefreshScrollViewDataSourceDidFinishedLoading:self.tableView];
}

#pragma mark UIScrollViewDelegate Methods
- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
    [pull egoRefreshScrollViewDidScroll:scrollView];
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
    [pull egoRefreshScrollViewDidEndDragging:scrollView];
}

#pragma mark EGORefreshTableHeaderDelegate Methods
- (void)egoRefreshTableHeaderDidTriggerRefresh:(EGORefreshTableHeaderView *)view
{
    // NSLog(@"egoRefreshTableHeaderDidTriggerRefresh");
    [self reloadMobiiAppCatalogsFromServer];
}

- (BOOL)egoRefreshTableHeaderDataSourceIsLoading:(EGORefreshTableHeaderView *)view
{
    // NSLog(@"egoRefreshTableHeaderDataSourceIsLoading: %d",reloading);
    return reloading;
}

- (NSDate *)egoRefreshTableHeaderDataSourceLastUpdated:(EGORefreshTableHeaderView *)view
{
    // NSLog(@"egoRefreshTableHeaderDataSourceLastUpdated");
    return [NSDate date];
}

- (BOOL)egoRefreshTableHeaderShouldTriggerRefresh:(EGORefreshTableHeaderView *)view
{
    if (self.currentLevel == 0) {
        return YES;
    }
    return NO;
}

@end
