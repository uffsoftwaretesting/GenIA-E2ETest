*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://localhost:5173/
${LOGIN_URL}    ${URL}/LogIn
${SIGNUP_URL}    ${URL}/SignUp

*** Test Cases ***
Successfully Register a New User
    [Documentation]    Test case to register a new user successfully
    Launch Browser     #troquei launch browser
    Verify Home Page
    Navigate To Login Page
    Navigate To Sign Up Page
    Fill Registration Form
    Submit Registration Form
    Verify Registration Success Message

*** Keywords ***
Launch Browser
    Open Browser    ${URL}    chrome
    Maximize Browser Window

Verify Home Page
    Page Should Contain Element    //div[@class='_header_axbsj_1']/div/a[2]/img

Navigate To Login Page
    Click Element    //div[@class='_header_axbsj_1']/div/a[2]/img
    Page Should Contain Element    //*[@class='_log_in_lv82k_1']/div[1]
    Click Element    //*[@class='_log_in_lv82k_1']//a[contains(text(), 'Sign Up')]

Navigate To Sign Up Page
    Page Should Contain Element    //*[@class='_sign_up_1u6og_1']/div[1]

Fill Registration Form
    Input Text    //*[@id='input_nome']    John
    Input Text    //*[@id='input_sobrenome']    Doe
    Input Text    //*[@id='input_email']    john.doe@example.com
    Input Text    //*[@id='input_confirmar_email']    john.doe@example.com
    Input Text    //*[@id='input_senha']    Password123
    Input Text    //*[@id='input_confirmar_senha']    Password123

Submit Registration Form
    Click Element    //*[@id='submit_form']

Verify Registration Success Message
    # Page Should Contain    //*[@id='success-message']
    # Element Should Contain    //*[@id='success-message']    Registration completed successfully!
    Page Should Contain   Registration completed successfully!


#Tudo OK