To create an End-to-End test script using Robot Framework for the Sign-Up page, you can follow the structure outlined below. This script leverages Python and Selenium to automate the tests. We'll implement the scenarios described in the user story.

### Robot Framework Script

```robot
*** Settings ***
Library           SeleniumLibrary
Test Setup        Open Sign Up Page
Test Teardown     Close Browser

*** Variables ***
${SIGN_UP_URL}    http://localhost:5173/SignUp
${VALID_NAME}     Maria
${VALID_SURNAME}  Silva
${VALID_EMAIL}    maria@example.com
${VALID_PASSWORD}     Senha123
${SUCCESS_MESSAGE}    Cadastro realizado com sucesso!
${ERROR_NAME_MSG}     Nome deve ter entre 2 e 50 caracteres.
${ERROR_SURNAME_MSG}  Sobrenome deve ter entre 2 e 50 caracteres.
${ERROR_EMAIL_MSG}    Os e-mails não coincidem.
${ERROR_PASSWORD_MSG}     A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula e um número.
${ERROR_TERMS_MSG}    Você deve aceitar os termos de uso.

*** Test Cases ***
Successful Registration
    [Documentation]    Test successful registration with valid data
    Fill Form Fields    ${VALID_NAME}    ${VALID_SURNAME}    ${VALID_EMAIL}    ${VALID_EMAIL}    ${VALID_PASSWORD}    ${VALID_PASSWORD}
    Check Terms Of Use
    Submit Form
    Validate Success Message    ${SUCCESS_MESSAGE}

Name Validation Error
    [Documentation]    Test registration with invalid name
    Fill Form Fields    M    ${VALID_SURNAME}    ${VALID_EMAIL}    ${VALID_EMAIL}    ${VALID_PASSWORD}    ${VALID_PASSWORD}
    Check Terms Of Use
    Submit Form
    Validate Error Message    ${ERROR_NAME_MSG}

Surname Validation Error
    [Documentation]    Test registration with invalid surname
    Fill Form Fields    ${VALID_NAME}    S    ${VALID_EMAIL}    ${VALID_EMAIL}    ${VALID_PASSWORD}    ${VALID_PASSWORD}
    Check Terms Of Use
    Submit Form
    Validate Error Message    ${ERROR_SURNAME_MSG}

Email Mismatch Error
    [Documentation]    Test registration with mismatched email
    Fill Form Fields    ${VALID_NAME}    ${VALID_SURNAME}    usuario@example.com    usuario@diferente.com    ${VALID_PASSWORD}    ${VALID_PASSWORD}
    Check Terms Of Use
    Submit Form
    Validate Error Message    ${ERROR_EMAIL_MSG}

Password Criteria Error
    [Documentation]    Test registration with invalid password
    Fill Form Fields    ${VALID_NAME}    ${VALID_SURNAME}    ${VALID_EMAIL}    ${VALID_EMAIL}    senha123    senha123
    Check Terms Of Use
    Submit Form
    Validate Error Message    ${ERROR_PASSWORD_MSG}

Terms Of Use Check Error
    [Documentation]    Test registration without accepting terms of use
    Fill Form Fields    ${VALID_NAME}    ${VALID_SURNAME}    ${VALID_EMAIL}    ${VALID_EMAIL}    ${VALID_PASSWORD}    ${VALID_PASSWORD}
    # Do not check terms of use intentionally
    Submit Form
    Validate Error Message    ${ERROR_TERMS_MSG}

*** Keywords ***
Open Sign Up Page
    Open Browser    ${SIGN_UP_URL}    Chrome
    Maximize Browser Window

Fill Form Fields
    [Arguments]    ${name}    ${surname}    ${email}    ${confirm_email}    ${password}    ${confirm_password}
    Input Text    xpath:/html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[@id='input_nome']    ${name}
    Input Text    xpath:/html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[2]    ${surname}
    Input Text    xpath:/html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[@id='input_email']    ${email}
    Input Text    xpath:/html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[@id='input_confirmar_email']    ${confirm_email}
    Input Text    xpath:/html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[@id='input_senha']    ${password}
    Input Text    xpath:/html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[@id='input_confirmar_senha']    ${confirm_password}

Check Terms Of Use
    Click Element    //input[@type='checkbox' and @id='terms_checkbox']

Submit Form
    Click Element    xpath:/html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/button[@id='submit_form']

Validate Success Message
    [Arguments]    ${expected_message}
    Wait Until Page Contains    ${expected_message}

Validate Error Message
    [Arguments]    ${expected_error_message}
    Wait Until Page Contains    ${expected_error_message}


# ### Explanation
# 1. **Libraries and Settings**: We use the `SeleniumLibrary` to interact with web elements. The `Open Sign Up Page` is set up as a test setup that gets executed before each test case to open the browser.

# 2. **Variables**: Defines constants used in the tests, such as the URL and expected messages.

# 3. **Test Cases**:
#    - Each test case fills out the form and performs actions to trigger potential error scenarios or successful registration. 

# 4. **Keywords**:
#    - `Open Sign Up Page`: Opens the sign-up page in a browser using the specified URL.
#    - `Fill Form Fields`: Input valid or invalid data into all required fields.
#    - `Check Terms Of Use`: Simulates checking the terms of use checkbox.
#    - `Submit Form`: Clicks the submit button to attempt registration.
#    - `Validate Success Message` and `Validate Error Message`: Validates the appearance of success/error messages.

# This script ensures comprehensive testing of the registration form by verifying both valid inputs and various invalid input scenarios described in the user story.