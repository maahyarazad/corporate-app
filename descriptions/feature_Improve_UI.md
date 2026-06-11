# Feature: Improve Registration UI/UX

## Target Screen

**registrationDetails.screen.js**

## Description

### 1. Submission Loading Overlay

After the user submits the registration form and the POST request is sent, display a full-screen blur overlay with a circular loading indicator. The overlay should remain visible until the server responds. This prevents multiple submissions and provides clear feedback that the request is being processed.

### 2. Birth Date Picker Height Consistency

The Birth Date Picker input field is currently taller than the other input fields on the screen. Adjust its styling so that its height matches the rest of the form inputs, ensuring a consistent and unified user interface.

### 3. Prevent Navigation

Once the registration form is submitted, lock the user on the current screen and disable all navigation actions until the server returns a response.


### 4. Contact Us Update

## Description 
at the **profSettings.js** file chnage the behavioiur of the handleContactUs and when user tap on this it will open the browser and redirect to the 
`https://services.german-emirates-club.com/support`
```js
 <Section title="Support">
            <Settings
              icon="face-agent"
              label={i18n.t("profile-tabs.settings-menu.contact-us")}
              onPress={handleContactUs}
            />
          </Section>
```