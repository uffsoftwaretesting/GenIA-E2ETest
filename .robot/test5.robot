To create an end-to-end (E2E) test script for "Test Case 3: Login User with incorrect email and password", we will use the Robot Framework with SeleniumLibrary. Here's how you can set up and execute the test script:

Before proceeding, ensure you have the required Python environment with Robot Framework and Selenium Library installed. You can install them using pip:

```bash
pip install robotframework
pip install robotframework-seleniumlibrary
```

Now, here is the test script written in Robot Framework syntax:

```robot framework
*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}                     http://automationexercise.com
${BROWSER}                 Chrome
${INVALID_EMAIL}           invalid@example.com
${INVALID_PASSWORD}        wrongpassword
${LOGIN_ERROR_MESSAGE}     Your email or password is incorrect!

*** Test Cases ***
Login With Incorrect Email And Password
    [Documentation]    Test Case 3: Login User with incorrect email and password.
    # Step 1: Launch browser
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window

    # Step 3: Verify that home page is visible successfully
    Title Should Be    Automation Exercise

    # Step 4: Click on 'Signup / Login' button
    Click Element    xpath=//a[contains(text(),'Signup / Login')]

    # Step 5: Verify 'Login to your account' is visible
    Element Text Should Be    xpath=//h2[contains(text(),'Login to your account')]    Login to your account

    # Step 6: Enter incorrect email address and password
    Input Text    xpath=//*[@name='email']    ${INVALID_EMAIL}
    Input Text    xpath=//*[@name='password']    ${INVALID_PASSWORD}

    # Step 7: Click 'login' button
    Click Button    xpath=//button[contains(.,'Login')]

    # Step 8: Verify error 'Your email or password is incorrect!' is visible
    Wait Until Page Contains    ${LOGIN_ERROR_MESSAGE}

    # Close the browser after the test
    Close Browser
# ```

### Explanation
# 1. **Settings Section**: Includes the necessary libraries and resources.
# 2. **Variables Section**: Contains the test data and elements, making it easier to maintain.
# 3. **Test Cases Section**: 
#    - **Step 1**: Opens the browser and navigates to the specified URL.
#    - **Step 3**: Verifies that the correct home page is loaded.
#    - **Step 4**: Clicks on the "Signup / Login" link.
#    - **Step 5**: Confirms the login form is visible.
#    - **Step 6**: Inputs the incorrect email and password.
#    - **Step 7**: Clicks the login button.
#    - **Step 8**: Ensures the error message for incorrect login details is displayed.
#    - **Cleanup**: Closes the browser.

### Notes
# - The `xpath` locator paths are based on assumptions and might need adjustments if the actual web elements have different identifiers.
# - Ensure the browser driver is set up and available in your system path for `Chrome` or any other browser you choose to run the test.

# ### Running the Test
# Save the script in a file named `LoginTest.robot` and execute it using Robot Framework:

# ```bash
# robot LoginTest.robot
# ```

# This command will run the script, launch the browser, and execute the test case as described in the Robot Framework script. Make sure the browser drivers (like ChromeDriver for Chrome) are installed and configured correctly on your path.