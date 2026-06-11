# Feature: Improve Registration UI/UX

## Target

All Screens

## Description

### 1. Restrict Console Logs to Development Environment

Find all instances of `console.log`, `console.error`, `console.warn`, and other debugging statements throughout the application.

Ensure these logs are only executed in the development environment and are excluded from production builds, as they provide no value to end users and may expose unnecessary information.

### 2. Replace Native Alerts with Toast Notifications

Find all usages of native alert dialogs, such as:

```js
Alert.alert(
  "Notice",
  "You have already logged in from another device!"
);
```

or

```js
alert(
  "Your card has expired. Please upload a new card and update your card details on the Profile page."
);
```

Replace them with the application's toast notification system:

```js
import { showToast } from "../src/Toast";
```

All user-facing notifications should use `showToast()` to provide a consistent user experience across the application.
