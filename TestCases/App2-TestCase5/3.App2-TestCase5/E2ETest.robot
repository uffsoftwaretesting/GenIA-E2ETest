*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://localhost:5173/
${LOGIN_URL}    ${URL}LogIn
${SIGNUP_URL}    ${URL}SignUp
${BROWSER}    Chrome

*** Test Cases ***
Successfully Register a New User
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Click Element     xpath=//*[@id="root"]/div/div[1]/div/a[2]        # Click Element    xpath=//*[@id='login-button']
    # Go To    ${LOGIN_URL}
    Element Should Be Visible    xpath=//*[@class='_log_in_lv82k_1']/div[1]
    Click Element    xpath=//*[@class='_log_in_lv82k_1']//a[contains(text(), 'Sign Up')]
    # Go To    ${SIGNUP_URL}
    Element Should Be Visible    xpath=//*[@class='_sign_up_1u6og_1']/div[1]
    Input Text    xpath=//*[@id='input_nome']    First Name
    Input Text    xpath=//*[@id='input_sobrenome']    Last Name
    Input Text    xpath=//*[@id='input_email']    user@example.com
    Input Text    xpath=//*[@id='input_confirmar_email']    user@example.com
    Input Text    xpath=//*[@id='input_senha']    Password123
    Input Text    xpath=//*[@id='input_confirmar_senha']    Password123
    Click Element    xpath=//*[@id='submit_form']
    Page Should Contain   Registration completed successfully!  # Element Should Be Visible    xpath=//*[@class='_message_Feedback_1caxf_17']
    Close Browser

#Tudo ok