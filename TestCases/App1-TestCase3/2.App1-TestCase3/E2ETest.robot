*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://automationexercise.com
${LOGIN_URL}    https://automationexercise.com/login
${INCORRECT_EMAIL}    incorrect@example.com
${INCORRECT_PASSWORD}    incorrectPassword

*** Test Cases ***
Login User with incorrect email and password
    Open Browser    ${URL}    chrome  #colocou launch browser
    Maximize Browser Window
    Title Should Be    Automation Exercise
    Click Link    Signup / Login
    Element Should Be Visible    //h2[text()='Login to your account']
    Input Text    //*[@id='form']//input[@name='email']    ${INCORRECT_EMAIL}
    Input Text    //*[@id='form']//input[@name='password']    ${INCORRECT_PASSWORD}
    Click Button    //*[@id='form']//button[@data-qa='login-button']
    Element Should Be Visible    //p[contains(text(), 'Your email or password is incorrect!')]     #colocou div modifiquei para p 
    Close Browser

#Tudo ok