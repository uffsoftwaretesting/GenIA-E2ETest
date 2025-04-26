*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://localhost:5173/
${LOGIN_URL}    http://localhost:5173/LogIn
${EMAIL}    invalid@example.com
${PASSWORD}    wrongpassword

*** Test Cases ***
Unsuccessfully Login with Incorrect Credentials
    [Documentation]    Test case for unsuccessful login with incorrect credentials.
    Open Browser    ${URL}    Chrome
    Maximize Browser Window
    Click Element    xpath=//*[@id="root"]/div/div[1]/div/a[2]    # Click Element    xpath=//*[@id='login-button']
    Wait Until Page Contains Element    xpath=//*[@class='_log_in_lv82k_1']/div[1]
    Input Text    xpath=//*[@id='input_email']    ${EMAIL}
    Input Text    xpath=//*[@id='input_senha']    ${PASSWORD}
    Click Element    xpath=//*[@class='_log_in_lv82k_1']/form/button
    Wait Until Page Contains Element    xpath=//*[contains(text(), 'User not found!')]
    Page Should Contain    User not found!
    Close Browser

#Tudo Ok