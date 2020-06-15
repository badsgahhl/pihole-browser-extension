## Using multiple Piholes

#### How does everything respond?

##### Background status and opening popup status:

If you open the popup, or the extension refreshes the status in the background it will show you the status the following:
- If one of your piholes throws an error, an error will show up
- If one of your piholes is offline, offline is displayed.
- Only if every pihole is online the extension will show online

##### Disabling / Enabling piholes

This works just normally. Pressing the slider sends a request to each pihole.
Errors will show in the badge text shortly if any pihole fails to change its status.

##### List Feature

Black / Whitelisting a domain will send this request to each pihole. For each pihole you will get one background color change.

E.g. if you add one domain to two piholes the background will change 2 times to green.

##### Debugging Errors in the popup

If any action in the popup shows you an error you can right click into the popup and press right-click and click "inspect".
In the new windows go to console. There are messages shown, together with the url of the pihole at where the error occurred.
