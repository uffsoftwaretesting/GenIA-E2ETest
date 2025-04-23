*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://localhost:5173/
${LOGIN_URL}    http://localhost:5173/LogIn
${EMAIL_INPUT}    //*[@id='input_email']
${PASSWORD_INPUT}    //*[@id='input_senha']
${LOGIN_BUTTON}    //*[@class='_log_in_lv82k_1']/form/button
${ERROR_MESSAGE}    //*[contains(text(), 'User not found!')]

*** Test Cases ***
Unsuccessfully Login with Incorrect Credentials
    Open Browser    ${URL}    chrome
    Maximize Browser Window
    Click Element    //*[@class='_header_axbsj_1']/div/a[2]    #modifiquei
    Element Should Be Visible    //*[@class='_log_in_lv82k_1']/div[1]
    Input Text    ${EMAIL_INPUT}    incorrect@example.com
    Input Text    ${PASSWORD_INPUT}    wrongpassword
    Click Element    ${LOGIN_BUTTON}
    Element Should Be Visible    ${ERROR_MESSAGE}
    Close Browser

#TUDO OK