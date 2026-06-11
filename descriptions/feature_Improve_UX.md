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


# Bug - Redeem stick in loading after adding ConfirmDialogHost

## Description
at this screen when  availOffer.screen.js when I try to redeem and I put wrong pin nymber the button stick in the loading and become disable

```js
const handleRedeem = async () => {
      setIsLoading(true);

      const merchantPin = (location?.merchant_pin ?? "").toString().trim();
     
      const enteredPin = (merchantCode ?? "").toString().trim();

      if (enteredPin !== merchantPin) {
        showToast(
          "error",
          i18n.t("redemption.error-header"),
          i18n.t("redemption.error-merchant-pin")
        );
        setCode("");
        setPinReady(false);
        return;
      }

      await onConsume(discAmount, totalAmount, paidAmount);
  };

  const handleConfirm = () => {
    showConfirm({
      title: i18n.t("redemption.confirm"),
      message: i18n.t("redemption.message"),
      confirmText: i18n.t("proceed"),
      cancelText: i18n.t("cancel"),
      onConfirm: handleRedeem,
    });
  };
```