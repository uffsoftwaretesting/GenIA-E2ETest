Certainly! Below is an E2E test script using the Robot Framework and Selenium for the test case "Login User with incorrect email and password". This script navigates to the website, attempts a login with incorrect credentials, and verifies if an error message is displayed. I've used the information you provided for the XPath expressions and HTML structure.

```robot framework
*** Settings ***
Library  SeleniumLibrary

*** Variables ***
${URL}           http://automationexercise.com
${BROWSER}       Chrome
${EMAIL}         invalid@example.com
${PASSWORD}      wrongpassword
${ERROR_MESSAGE}  Your email or password is incorrect!

*** Test Cases ***
Login User With Incorrect Email And Password
    [Documentation]    Test Case to verify login with invalid credentials
    [Setup]    Open Browser To Login Page
    Go To Home Page
    Click Signup / Login
    Verify Login Page Visible
    Enter Incorrect Credentials
    Submit Login
    Verify Error Message Displayed

*** Keywords ***
Open Browser To Login Page
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window

Go To Home Page
    Page Should Contain Element    //a[contains(text(),'Home')]

Click Signup / Login
    Click Element    //a[contains(text(),'Signup / Login')]

Verify Login Page Visible
    Page Should Contain Element    //h2[contains(text(),'Login to your account')]

Enter Incorrect Credentials
    Input Text    //input[@name='email']    ${EMAIL}
    Input Text    //input[@name='password']    ${PASSWORD}

Submit Login
    Click Element    //button[@type='submit' and contains(text(),'Login')]

Verify Error Message Displayed
    Page Should Contain Element    //div[contains(@class, 'alert') and contains(text(),'Your email or password is incorrect!')]
    Element Text Should Be    //div[contains(@class, 'alert') and contains(text(),'Your email or password is incorrect!')]    ${ERROR_MESSAGE}

# *** Teardown ***
    Close Browser
# ```

### Key Details:

1. **Open Browser To Login Page**: 
   - Opens the Chrome browser and navigates to the provided URL.
   - Maximizes the window for better visibility during testing.

2. **Go To Home Page**: 
   - Verifies the presence of the "Home" element, ensuring the home page is loaded successfully.

3. **Click Signup / Login**: 
   - Clicks the 'Signup / Login' link to navigate to the login page.

4. **Verify Login Page Visible**: 
   - Verifies that the ‘Login to your account’ section is visible to confirm correct page loading.

5. **Enter Incorrect Credentials**: 
   - Inputs an incorrect email and password into their respective fields.

6. **Submit Login**: 
   - Clicks the login button to attempt sign-in.

7. **Verify Error Message Displayed**: 
   - Checks for the presence of the error message indicating a failed login attempt due to incorrect credentials.

This script follows the logic of your test case step-by-step, using the Robot Framework's syntax combined with Selenium commands to automate a real user scenario. Adjust the XPaths if the actual identifiers differ in the full HTML.