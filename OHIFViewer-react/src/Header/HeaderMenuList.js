import UserPreferences from "../UserPreferences/UserPreferences";

export default [
  {
    "title": "Preferences",
    "icon": "fa fa-user",
    "onClick": UserPreferences,
    "state": { "modal": true }
  },
  {
    "title": "About",
    "icon": "fa fa-info",
    "link": "http://ohif.org"
  }
];
