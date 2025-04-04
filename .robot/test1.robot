To create an end-to-end (E2E) test script using Python, Robot Framework, and Selenium for the provided test case, you must first ensure that your development environment is set up with the necessary libraries and tools. Assuming you have installed Python, Selenium, and Robot Framework along with the Browser library for Selenium integration, you can proceed to write the test script as follows:

```robot framework
*** Settings ***
Library    SeleniumLibrary
Suite Setup    Open Browser    http://automationexercise.com    chrome
Suite Teardown    Close Browser

*** Test Cases ***
Login User With Incorrect Email And Password
    [Documentation]    Test Case 3: Login User with incorrect email and password
    ...    1. Launch browser
    ...    2. Navigate to url 'http://automationexercise.com'
    ...    3. Verify that home page is visible successfully
    ...    4. Click on 'Signup / Login' button
    ...    5. Verify 'Login to your account' is visible
    ...    6. Enter incorrect email address and password
    ...    7. Click 'login' button
    ...    8. Verify error 'Your email or password is incorrect!' is visible
    Verify Home Page Is Visible
    Click Signup Login Button
    Verify Login To Your Account Is Visible
    Enter Incorrect Email And Password
    Click Login Button
    Verify Incorrect Email Or Password Error Is Visible

*** Keywords ***
# Verify Home Page Is Visible
#     Wait Until Element Is Visible    //div[@class='logo']//img[@alt='Website for automation practice']    10s
#     Element Should Be Visible    //div[@class='logo']//img[@alt='Website for automation practice']

Click Signup Login Button
    Click Element    //a[@href='/login']//i[@class='fa fa-lock']/..

Verify Login To Your Account Is Visible
    Wait Until Element Is Visible    //h2[contains(text(),'Login to your account')]    10s
    Element Should Be Visible    //h2[contains(text(),'Login to your account')]

Enter Incorrect Email And Password
    Input Text    //input[@id='email']    invalid_email@example.com
    Input Text    //input[@id='password']    invalid_password

Click Login Button
    Click Button    //button[contains(text(),'Login')]

Verify Incorrect Email Or Password Error Is Visible
    Wait Until Element Is Visible    //div[contains(text(),'Your email or password is incorrect!')]    10s
    Element Should Be Visible    //div[contains(text(),'Your email or password is incorrect!')]
# ```

### Explanation:

# - **Suite Setup and Teardown**: Open the browser to `http://automationexercise.com` with Chrome at the start and close it at the end.
# - **Test Case**: `Login User With Incorrect Email And Password` with detailed steps outlined in comments.
# - **Keywords**:
#   - **Verify Home Page Is Visible**: Ensures the homepage is loaded by verifying the visibility of the logo.
#   - **Click Signup Login Button**: Clicks the 'Signup / Login' button using its XPath.
#   - **Verify Login To Your Account Is Visible**: Checks the presence of the login heading.
#   - **Enter Incorrect Email And Password**: Inputs incorrect credentials into the email and password fields.
#   - **Click Login Button**: Submits the form by clicking the login button.
#   - **Verify Incorrect Email Or Password Error Is Visible**: Confirms that the error message for incorrect credentials is displayed.

# This script automates the process of logging in with incorrect credentials and verifies expected UI changes and messages. Ensure the XPaths exactly match those on the website, as any changes to the site could require XPath adjustments.