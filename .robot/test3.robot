Certainly! To create an end-to-end test script in Robot Framework that uses Selenium for web automation, we'll use the following assumptions and details drawn from the given HTML snippet and JSON objects:

- Since the actual login element identifiers like `input` fields or the `login` button aren't explicitly available from your HTML snippet, we resort to hypothesized XPath locators noted in the JSON list.
- We assume common browser navigation and interaction sequences are part of the Robot Framework's `SeleniumLibrary`.

Below is the Robot Framework test script implementing the given test case for incorrect login:

```robot
*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}                           http://automationexercise.com
${BROWSER}                       chrome
${INVALID_EMAIL}                 invalid@example.com
${INVALID_PASSWORD}              wrongpassword
${EMAIL_FIELD_XPATH}             //input[@name='email']
${PASSWORD_FIELD_XPATH}          //input[@name='password']
${LOGIN_BUTTON_XPATH}            //button[text()='Login']
${ERROR_MESSAGE_XPATH}           //div[contains(text(),'Your email or password is incorrect!')]

*** Test Cases ***
Test Case 3: Login User with Incorrect Email and Password
    [Documentation]    This test case verifies the login functionality with incorrect email and password.
    [Tags]    login    negative

    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    
    # Step 3: Verify that home page is visible successfully
    Page Should Contain Element    xpath://a[@href='/' and contains(@style, 'color: orange')]
    
    # Step 4: Click on 'Signup / Login' button
    Click Link    xpath://a[@href='/login']
    
    # Step 5: Verify 'Login to your account' is visible
    Page Should Contain Text      Login to your account
    
    # Step 6: Enter incorrect email address and password
    Input Text    ${EMAIL_FIELD_XPATH}    ${INVALID_EMAIL}
    Input Text    ${PASSWORD_FIELD_XPATH}    ${INVALID_PASSWORD}
    
    # Step 7: Click 'login' button
    Click Button    ${LOGIN_BUTTON_XPATH}
    
    # Step 8: Verify error 'Your email or password is incorrect!' is visible
    Page Should Contain Element    ${ERROR_MESSAGE_XPATH}
    
    # Close Browser
    Close Browser
```

### Explanation:

1. **Settings and Variables**:
   - **SeleniumLibrary**: Used for web browser automation.
   - Variables section defines constants like `URL`, `BROWSER`, login credentials, and XPaths extracted from assumptions.

2. **Test Case**:
   - **Open Browser**: Initiates a browser session.
   - **Page Verification**: Uses `Page Should Contain Element` and `Page Should Contain Text` to verify page visibility.
   - **Interactions**: Includes clicking, text input, and verification steps, following typical user action sequences.
   - **Error Handling**: Validates the presence of expected error messages upon unsuccessful login attempts.

The test script should be executed in an environment configured with Robot Framework and Selenium dependencies, ensuring that the Selenium library is correctly installed and the appropriate web driver (e.g., ChromeDriver) is available in the system path. Adjust XPath selectors as per the actual HTML structure if there are discrepancies.