*** Settings ***
Library           SeleniumLibrary

*** Variables ***
${BASE_URL}      http://localhost:5173/
${LOGIN_BUTTON}  xpath=//*[@id="root"]/div/div[1]/div/a[2]        #//*[@id='login-button']  
${SIGNUP_LINK}   xpath=//*[@id='root']//p/a[contains(text(), 'Sign Up')]
${FIRST_NAME}    xpath=//*[@id='input_nome']
${LAST_NAME}     xpath=//*[@id='input_sobrenome']
${EMAIL}         xpath=//*[@id='input_email']
${CONFIRM_EMAIL}     xpath=//*[@id='input_confirmar_email']
${PASSWORD}      xpath=//*[@id='input_senha']
${CONFIRM_PASSWORD}     xpath=//*[@id='input_confirmar_senha']
${SIGNUP_BUTTON}     xpath=//*[@id='submit_form']           #//*[@id='form']/button
${SUCCESS_MESSAGE}     xpath=//*[@id='success-message']

*** Test Cases ***
Successfully Register a New User
    Open Browser    ${BASE_URL}    Chrome
    Maximize Browser Window
    Click Element    ${LOGIN_BUTTON}
    Click Element    ${SIGNUP_LINK}
    Element Should Be Visible    ${FIRST_NAME}
    Input Text    ${FIRST_NAME}    John
    Input Text    ${LAST_NAME}    Doe
    Input Text    ${EMAIL}    johndoe@example.com
    Input Text    ${CONFIRM_EMAIL}    johndoe@example.com
    Input Text    ${PASSWORD}    Password123
    Input Text    ${CONFIRM_PASSWORD}    Password123
    Click Element    ${SIGNUP_BUTTON}
    Page Should Contain   Registration completed successfully!        # Element Should Be Visible    ${SUCCESS_MESSAGE}
    Close Browser

#Tudo ok