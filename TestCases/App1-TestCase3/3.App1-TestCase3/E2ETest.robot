*** Settings ***
Library    SeleniumLibrary
Library    Process
Suite Setup    Open Browser    http://automationexercise.com    chrome
Suite Teardown    Close Browser

*** Test Cases ***
Login User with incorrect email and password
    [Documentation]    Test case to verify login functionality with incorrect credentials.
    Verify Home Page is Visible
    Click On Signup Login
    Verify Login Page Is Visible
    Enter Incorrect Credentials
    Click Login Button
    Verify Error Message Is Visible

*** Keywords ***
Verify Home Page is Visible
    Title Should Be    Automation Exercise

Click On Signup Login
    Click Element    //a[contains(text(), 'Signup / Login')]

Verify Login Page Is Visible
    Element Should Be Visible    //h2[text()='Login to your account']

Enter Incorrect Credentials
    Input Text    //*[@id='form']//input[@name='email']    invalid@example.com
    Input Text    //*[@id='form']//input[@name='password']    wrongpassword

Click Login Button
    Click Element    //button[@data-qa='login-button']

Verify Error Message Is Visible
    Sleep    2s
    Element Should Be Visible    //p[contains(text(), 'Your email or password is incorrect!')]    #colocou div modifiquei para p 

#Tudo OK