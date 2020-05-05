# Switch-for-PiHole

This is a small extension to revive the project of Yoder Spencer.
https://github.com/Spencer-Yoder/Remote-Switch-for-Pi-Hole-Chrome	

I reused some of his code and icons to build this extension, but a lot of parts got rebuild.
This extension is available in the chrome webstore and mozilla addon store.

### How to use:

- Install the extension
- Right click the "Raspberry" Icon in the top navigation fo your browser and click 'Settings'
- Enter your host address (including http:// or https://)
- Go to your Pihole settings. Click 'Api/Web interface' and then on 'Show Api token' at the bottom of your screen.
- Copy the token to the settings. Press save.
- Congratulations you successfully installed and configured the extension.


### Troubleshooting

#### Status / Slider are not working
Please check that you used the correct host address. Use the address where you can see your dashboard page (statistics board).
For example if your pihole is located at http://192.168.178.2 but you can see your dashboard/admin page at http://192.168.178.2/admin then don't forget to add /admin to the address.


This is not an official Pi-Hole application.
Pi-hole® is a registered trademark of Pi-hole LLC” or “FTLDNS™ is a trademark of Pi-hole LLC
