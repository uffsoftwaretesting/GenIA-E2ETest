*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://localhost:5173/
${EMAIL_INPUT}    xpath=//*[@id='input_email']
${PASSWORD_INPUT}    xpath=//*[@id='input_senha']
${LOGIN_BUTTON}    xpath=//*[@class='_log_in_lv82k_1']/form/button
${ERROR_MESSAGE}    xpath=//*[contains(text(), 'User not found!')]

*** Test Cases ***
Unsuccessfully Login with Incorrect Credentials
    Open Browser    ${URL}    chrome
    Click Element    xpath=//*[@class='_header_axbsj_1']/div/a[2]    #modifiquei
    Input Text    ${EMAIL_INPUT}    incorrectemail@example.com
    Input Text    ${PASSWORD_INPUT}    incorrectpassword
    Click Button    ${LOGIN_BUTTON}
    Element Should Be Visible    ${ERROR_MESSAGE}
    Close Browser

#TUDO OK