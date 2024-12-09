Below is a Robot Framework script using Python and Selenium for an E2E test of the Sign-Up page, following the user stories and scenarios you provided. This script uses the Page Object Model approach, where each field and interaction on the page is wrapped in keywords that abstract away the details.

```robot
*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}        http://localhost:5173/SignUp
${VALID_NAME}        Maria
${VALID_SURNAME}     Silva
${VALID_EMAIL}       maria@example.com
${VALID_PASSWORD}    Senha123
${MISMATCH_EMAIL}    wrong@example.com
${SHORT_PASSWORD}    senha123
${INVALID_NAME}      M
${INVALID_SURNAME}   S

*** Test Cases ***
Sign Up with Valid Data
    Open Browser    ${URL}    Chrome
    Fill Sign Up Form with Valid Data    ${VALID_NAME}    ${VALID_SURNAME}    ${VALID_EMAIL}    ${VALID_PASSWORD}    ${VALID_PASSWORD}
    Submit Form
    Page Should Contain    Cadastro realizado com sucesso!
    [Teardown]    Close Browser

Invalid Name
    Open Browser    ${URL}    Chrome
    Fill Field     xpath=/html/body/div/div/div[2]/form/input[1]    ${INVALID_NAME}  # Name
    Fill Sign Up Form with Valid Data Except    surname=${VALID_SURNAME}    email=${VALID_EMAIL}    password=${VALID_PASSWORD}    confirm_password=${VALID_PASSWORD}
    Submit Form
    Page Should Contain    Nome deve ter entre 2 e 50 caracteres.
    [Teardown]    Close Browser

Invalid Surname
    Open Browser    ${URL}    Chrome
    Fill Field    xpath=/html/body/div/div/div[2]/form/input[2]    ${INVALID_SURNAME}  # Surname
    Fill Sign Up Form with Valid Data Except    name=${VALID_NAME}    email=${VALID_EMAIL}    password=${VALID_PASSWORD}    confirm_password=${VALID_PASSWORD}
    Submit Form
    Page Should Contain    Sobrenome deve ter entre 2 e 50 caracteres.
    [Teardown]    Close Browser

Email and Confirm Email Mismatch
    Open Browser          ${URL}    Chrome
    Fill Field            xpath=/html/body/div/div/div[2]/form/input[3]    ${VALID_EMAIL}  # Email
    Fill Field            xpath=/html/body/div/div/div[2]/form/input[4]    ${MISMATCH_EMAIL}  # Confirm Email
    Fill Sign Up Form with Valid Data Except    name=${VALID_NAME}    surname=${VALID_SURNAME}    password=${VALID_PASSWORD}    confirm_password=${VALID_PASSWORD}
    Submit Form
    Page Should Contain    Os e-mails não coincidem.
    [Teardown]    Close Browser

Password Validation Failure
    Open Browser    ${URL}    Chrome
    Fill Field    xpath=/html/body/div/div/div[2]/form/input[5]    ${SHORT_PASSWORD}  # Password
    Fill Field    xpath=/html/body/div/div/div[2]/form/input[6]    ${SHORT_PASSWORD}  # Confirm Password
    Fill Sign Up Form with Valid Data Except    name=${VALID_NAME}    surname=${VALID_SURNAME}    email=${VALID_EMAIL}    confirm_email=${VALID_EMAIL}
    Submit Form
    Page Should Contain    A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula e um número.
    [Teardown]    Close Browser

Terms of Use Not Accepted
    Open Browser    ${URL}    Chrome
    Fill Sign Up Form with Valid Data    ${VALID_NAME}    ${VALID_SURNAME}    ${VALID_EMAIL}    ${VALID_PASSWORD}    ${VALID_PASSWORD}
    Uncheck Terms of Use
    Submit Form
    Page Should Contain    Você deve aceitar os termos de uso.
    [Teardown]    Close Browser

*** Keywords ***
Fill Sign Up Form with Valid Data
    [Arguments]    ${name}    ${surname}    ${email}    ${confirm_email}    ${password}    ${confirm_password}
    Fill Field        xpath=/html/body/div/div/div[2]/form/input[1]    ${name}
    Fill Field        xpath=/html/body/div/div/div[2]/form/input[2]    ${surname}
    Fill Field    xpath=/html/body/div/div/div[2]/form/input[3]    ${email}
    Fill Field    xpath=/html/body/div/div/div[2]/form/input[4]    ${confirm_email}
    Fill Field    xpath=/html/body/div/div/div[2]/form/input[5]    ${password}
    Fill Field    xpath=/html/body/div/div/div[2]/form/input[6]    ${confirm_password}
    Check Terms of Use

Fill Sign Up Form with Valid Data Except
    [Arguments]    ${name}=${EMPTY}    ${surname}=${EMPTY}    ${email}=${EMPTY}    ${password}=${EMPTY}    ${confirm_password}=${EMPTY}
    [Documentation]    Fills all form fields with valid defaults, allowing exception overrides.
    Run Keyword If    '${name}' != '${EMPTY}'    Fill Field    xpath=/html/body/div/div/div[2]/form/input[1]    ${name}
    Run Keyword If    '${surname}' != '${EMPTY}'    Fill Field    xpath=/html/body/div/div/div[2]/form/input[2]    ${surname}
    Run Keyword If    '${email}' != '${EMPTY}'    Fill Field    xpath=/html/body/div/div/div[2]/form/input[3]    ${email}
    Run Keyword If    '${password}' != '${EMPTY}'    Fill Field    xpath=/html/body/div/div/div[2]/form/input[5]    ${password}
    Run Keyword If    '${confirm_password}' != '${EMPTY}'    Fill Field    xpath=/html/body/div/div/div[2]/form/input[6]    ${confirm_password}
    Check Terms of Use

Submit Form
    Click Button    xpath=/html/body/div/div/div[2]/form/button

Check Terms of Use
    Select Checkbox    xpath=//input[@type="checkbox"]

Uncheck Terms of Use
    Unselect Checkbox    xpath=//input[@type="checkbox"]

### Key Points of the Script

# - **Variables**: These hold the constants for valid and invalid inputs.
# - **Keywords**:
#   - **Fill Sign Up Form**: Fills form fields using provided or default valid data.
#   - **Submit Form**: Clicks the sign-up button to submit the form.
#   - **Check/Uncheck Terms of Use**: Checks or unchecks the checkbox for terms of use agreement.

# The above script emulates the form submission process with various data permutations, verifying form validations and error messages as specified in the user stories.