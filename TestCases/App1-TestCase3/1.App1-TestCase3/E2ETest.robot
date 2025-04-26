# *** Settings ***
# Library           SeleniumLibrary

# *** Variables ***
# ${URL}            http://automationexercise.com
# ${LOGIN_URL}     https://automationexercise.com/login
# ${INCORRECT_EMAIL}    test@example.com
# ${INCORRECT_PASSWORD}     wrongpassword

# *** Test Cases ***
# Login User with Incorrect Email and Password
#     Open Browser    ${URL}    chrome
#     Maximize Browser Window
#     Title Should Be    Automation Exercise
#     Click Element    //a[contains(text(), 'Signup / Login')]
#     Element Should Be Visible    //h2[text()='Login to your account']
#     Input Text    //*[@id='form']//input[@name='email']    ${INCORRECT_EMAIL}
#     Input Text    //*[@id='form']//input[@name='password']    ${INCORRECT_PASSWORD}
#     Click Button    //*[@id='form']//button[@type='submit']
#     Element Should Be Visible    //p[contains(text(), 'Your email or password is incorrect!')]   #colocou div modifiquei para p 
#     Close Browser

# #Tudo ok

*** Settings ***
Library           SeleniumLibrary

*** Variables ***
${URL}            http://automationexercise.com
${LOGIN_URL}     https://automationexercise.com/login
${INCORRECT_EMAIL}    test@example.com
${INCORRECT_PASSWORD}     wrongpassword

*** Test Cases ***
Login User with Incorrect Email and Password
    Open Browser    ${URL}    chrome
    Maximize Browser Window
    Click Element    //a[contains(text(), 'Signup / Login')]
    Input Text    //*[@id='form']//input[@name='email']    ${INCORRECT_EMAIL}
    Input Text    //*[@id='form']//input[@name='password']    ${INCORRECT_PASSWORD}
    Click Button    //*[@id='form']//button[@type='submit']
    Element Should Be Visible    //div[contains(text(), 'Your email or password is incorrect!')]  
    Close Browser