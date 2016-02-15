# zuuk:stale-session

Stale session and session timeout handling for [meteorjs](http://www.meteor.com/).

## Quick Start

```sh
$ meteor add zuuk:stale-session
```

## Key Concepts

When a user logs in to a meteor application, they may gain access to privileged information and functionality.  If they neglect to log off, another user of the same computer can effectively impersonate that user and gains the same rights.  As it currently stands, (meteor 0.6.6.3), login tokens remain valid for eternity so this creates a large window of opportunity for impersonators.

This package is designed to detect a user's inactivity and automatically log them off after a configurable amount of time thereby reducing the size of this window to just the inactivity delay.

It is possible to configure both the timeout and the events that consitute activity.

The user will be logged off whether the browser window remains open or not.

The user is logged off by the server and disabling javascript in the browser (kind of pointless in meteor!) would not prevent automatic log off.

The user can be logged on multiple times on multiple devices and activity in any one of those devices will keep the sessions alive.

The plugin uses a heartbeat that is configurable but defaulted to ensure that the server is not inundated with heartbeats from clients in systems with many concurrent users.

## Configuration

Configuration is via `Meteor.settings.public`.

- `staleSessionInactivityTimeout` - the amount of time (in ms) after which, if no activity is noticed, a session will be considered stale - default 30 minutes.
- `staleSessionPurgeInterval` - interval (in ms) at which stale sessions are purged i.e. found and forcibly logged out - default 1 minute.
- `staleSessionHeartbeatInterval` - interval (in ms) at which activity heartbeats are sent up to the server - default every 3 minutes.
- `staleSessionActivityEvents` - the jquery events which are considered indicator of activity e.g. in an on() call - default `mousemove click keydown`

You can set these variables in `config/settings.json` and then launch Meteor with `meteor --settings config/settings.json`.

Example `config/settings.json` file:

```json
{
  "public": {
    "staleSessionInactivityTimeout": 1800000,
    "staleSessionHeartbeatInterval": 180000,
    "staleSessionPurgeInterval": 60000,
    "staleSessionActivityEvents": "mousemove click keydown"
  }
}
```


## Background

A meteor project I was working on at [ZUUK](http://www.zuuk.com/), required user sessions to timeout after a period of inactivity.  Meteor itself doesn't currently (0.6.6.3) support this out of the box and, though there were several plugins already available on [Atmosphere](https://atmosphere.meteor.com/), none of them worked reliably for me so I was forced to create my own for the project.  I owe those other packages a great deal of gratitude as this package is effectively just taking ideas from them and making them work in a simpler more reliable fashion for my project.  I'm putting this back into the community in the hope it will help in the same situation.

## License

MIT
