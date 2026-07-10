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



# Bug - NationalityInput and DropDown Modal Jumps to Top on Close

## Description

The `NationalityInput` and `DropDown` components exhibit an unexpected UI behavior when being dismissed.

When the modal is closed, it briefly jumps or scrolls to the top before disappearing. This creates a noticeable visual flicker and results in a poor user experience.

## Expected Behavior

The modal should close smoothly from its current position without changing its scroll position or jumping to the top.

## Actual Behavior

When the modal is dismissed, it jumps to the top momentarily before disappearing.




# Bug - Registration State Is Not Being Preserved

## Description

In `registration.screen.js`, when a user navigates away from the registration screen and returns to the login page, all entered form data is lost.

The registration state should be preserved so that users can continue where they left off without having to re-enter their information.

## Expected Behavior

When a user navigates away from the registration screen and then returns, the previously entered data should remain intact.

## Actual Behavior

When a user leaves the registration screen and returns, all form state is reset and the entered data is lost.


# Feature - Add Loading State to Registration Button

## Description

In `registration.screen.js`, when a user submits the registration form, a loading indicator should be displayed on the submit button while the request is being processed by the server.

Additionally, navigation should be temporarily disabled during the request to prevent users from leaving the screen or triggering duplicate submissions before the request completes.

## Expected Behavior

- Display a loading indicator on the submit button immediately after the user submits the form.
- Disable the submit button to prevent multiple submissions.
- Prevent navigation away from the screen while the request is in progress.
- Re-enable navigation and remove the loading indicator once the request completes, whether successfully or with an error.
- Navigate to the next screen only after receiving a successful response from the server.

## Actual Behavior

- No loading indicator is displayed while the request is being processed.
- Users can navigate away from the screen during the request.
- Multiple submissions may be triggered before the initial request completes.


# Feature - Automatically Retrieve OTP from SMS

## Description

In `otpVerification.js`, add support for automatically detecting and retrieving the OTP from incoming SMS messages.

When an OTP message is received, the application should automatically populate the OTP input field and submit the code to the server for verification without requiring manual user input.

## Expected Behavior

- Detect incoming SMS messages containing the OTP.
- Automatically extract the OTP code from the message.
- Populate the OTP input field with the extracted code.
- Automatically send the OTP to the server for verification.
- If verification is successful, continue to the next step of the authentication flow.

## Notes

- The implementation should follow platform-specific best practices for OTP autofill on both iOS and Android.
- Users should still be able to manually enter the OTP if automatic detection is unavailable or fails.



# Feature - Add Support Link to Login Page

## Description

Add a **Support** link to the Login page, similar to the **Contact Us** option in `profSettings`, so that users who are unable to log in or are experiencing issues can access the support portal.

### Implementation

```js
const handleContactUs = async () => {
  try {
    await WebBrowser.openBrowserAsync(
      "https://services.german-emirates-club.com/support"
    );
  } catch (error) {
    showToast("error", "Error Occurred", "Cannot Open Support Page");
  }
};
```

