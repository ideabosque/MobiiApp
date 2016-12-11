There are two parts to any PhoneGap plugin, native code and JavaScript code. There could also be third party native libraries and other web assets like HTML, CSS and images.
On iOS, the plugin Objective-C source code needs to be included in your PhoneGap iOS project. In Xcode 4 you can do this by dragging the .m and .h (NSData+Base64.h, NSData+Base64.m, Screenshot.h, Screenshot.m) files from Finder and dropping them onto the Plugins folder in Xcode project area. Make sure that you select "Create groups for any added folders", tick "Copy items into destination group's folder" and that the appropriate target is checked.
In addition, the JavaScript (Screenshot.js) for the plugin needs to be added to the ./www/* folder of your PhoneGap iOS project and linked in your HTML source code.
The final thing that needs to be done is an additional element needs to be added to the PhoneGap.plist file (located in the Supporting Files folder of your project). The PhoneGap.plist file describes what plugins are allowed to be called from JavaScript and maps a friendly plugin name like "Screenshot" to the class name that implements the plugin like "Screenshot". The PhoneGap.plist file should look like this:
<plist version="1.0">
     <dict>
          ...
          <key>Plugins</key>
          <dict>
               ...
               <key>Screenshot</key>
               <string>Screenshot</string>
               ...
          </dict>
          ...
     </dict>
</plist>
The developer of the plugin should document what the name and value are that need to be added to the PhoneGap.plist file. If that is not clear then you can figure out the name used since it appears in calls to PhoneGap.exec(success, failure, "Screenshot", "..."); and you can figure out the Objective-C class if you have access to the plugin source code.