# Module: Commands

The Commands Module allows us to register one or more commands scoped to
specific contexts. Commands can be run by [hotkeys][#], [toolbar buttons][#],
and any registered custom react component (like a [viewport][#] or [panel][#]).
Here is a simple example commands module:

```js
{
    getCommandsModule() {
        return {
            actions: {
                speak: ({ viewports, words }) => {
                    console.log(viewports, words);
                },
            },
            definitions: {
                rotateViewportCW: {
                    commandFn: actions.rotateViewport,
                    storeContexts: ['viewports'],
                    options: { rotation: 90 }
                },
                rotateViewportCCW: {
                    commandFn: actions.rotateViewport,
                    storeContexts: ['viewports'],
                    options: { rotation: -90 },
                    context: 'ACTIVE_VIEWER::CORNERSTONE'
                },
            },
            defaultContext: 'VIEWER'
        }
    }
}
```
