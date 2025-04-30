1. Build with following command:

```bash
PUBLIC_URL=/ohif/ yarn run build
```

2. Copy the build folder to the platform/app/public/ohif folder since above we are specifying PUBLIC_URL=/ohif/

3. Serve the iframe.html which is in platform/app/public folder

Note: depends on where you host it, you might need to change the iframe.html src to point to the correct URL.

4. You will see we are able to navigate to different pages by clicking on the buttons.


------

To change the initial width for the side panels, edit this file

extensions/default/src/ViewerLayout/constants/panels.ts

-----
