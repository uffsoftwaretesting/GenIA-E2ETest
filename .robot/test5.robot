Below is a Robot Framework script using Python and Selenium that performs an end-to-end test for the Sign-Up page based on the given user stories and JSON field details. This script handles opening the page, filling in form fields with both valid and invalid data, checking validations and error messages, and verifying successful submissions.

Please note that you will need Python, Selenium, and the Robot Framework installed, along with the SeleniumLibrary to execute this script.

```robot
*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}                          http://localhost:5173/SignUp
${BROWSER}                      chrome
${VALID_NAME}                   Maria
${VALID_SURNAME}                Silva
${VALID_EMAIL}                  maria@example.com
${VALID_PASSWORD}               Senha123
${INVALID_NAME}                 M
${INVALID_SURNAME}              S
${INVALID_EMAIL}                usuario@diferente.com
${INVALID_PASSWORD}             senha123

*** Test Cases ***
Test Successful Registration
    [Documentation]    Test successful form submission with valid data
    Open Browser To Sign Up Page
    Fill Form With Valid Data
    Submit The Form
    Verify Successful Submission

Test Name Validation
    [Documentation]    Verify validation for invalid name input
    Open Browser To Sign Up Page
    Fill In Name With    ${INVALID_NAME}
    Fill Form With Valid Data Except Name
    Submit The Form
    Verify Error Message    Nome deve ter entre 2 e 50 caracteres.

Test Surname Validation
    [Documentation]    Verify validation for an invalid surname input
    Open Browser To Sign Up Page
    Fill In Surname With    ${INVALID_SURNAME}
    Fill Form With Valid Data Except Surname
    Submit The Form
    Verify Error Message    Sobrenome deve ter entre 2 e 50 caracteres.

Test Email Confirmation Validation
    [Documentation]    Verify validation for mismatched email confirmation
    Open Browser To Sign Up Page
    Fill In Email With    ${VALID_EMAIL}
    Fill In Confirm Email With    ${INVALID_EMAIL}
    Fill Form With Valid Data Except Confirm Email
    Submit The Form
    Verify Error Message    Os e-mails não coincidem.

Test Password Validation
    [Documentation]    Verify validation for a password that does not meet criteria
    Open Browser To Sign Up Page
    Fill In Password With    ${INVALID_PASSWORD}
    Fill Form With Valid Data Except Password
    Submit The Form
    Verify Error Message    A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula e um número.

Test Terms Checkbox Validation
    [Documentation]    Verify validation for unmarked terms checkbox
    Open Browser To Sign Up Page
    Fill Form With Valid Data
    Do Not Check Terms
    Submit The Form
    Verify Error Message    Você deve aceitar os termos de uso.

*** Keywords ***
Open Browser To Sign Up Page
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Wait Until Page Contains Element    xpath=/html/body/div/div/div[2]/div/form/input[1]

Fill Form With Valid Data
    Fill In Name With    ${VALID_NAME}
    Fill In Surname With    ${VALID_SURNAME}
    Fill In Email With    ${VALID_EMAIL}
    Fill In Confirm Email With    ${VALID_EMAIL}
    Fill In Password With    ${VALID_PASSWORD}
    Fill In Confirm Password With    ${VALID_PASSWORD}
    Check Terms

Fill In Name With
    [Arguments]    ${name}
    Input Text    xpath=/html/body/div/div/div[2]/div/form/input[1]    ${name}

Fill In Surname With
    [Arguments]    ${surname}
    Input Text    xpath=/html/body/div/div/div[2]/div/form/input[2]    ${surname}

Fill In Email With
    [Arguments]    ${email}
    Input Text    xpath=/html/body/div/div/div[2]/div/form/input[3]    ${email}

Fill In Confirm Email With
    [Arguments]    ${confirm_email}
    Input Text    xpath=/html/body/div/div/div[2]/div/form/input[4]    ${confirm_email}

Fill In Password With
    [Arguments]    ${password}
    Input Text    xpath=/html/body/div/div/div[2]/div/form/input[5]    ${password}

Fill In Confirm Password With
    [Arguments]    ${confirm_password}
    Input Text    xpath=/html/body/div/div/div[2]/div/form/input[6]    ${confirm_password}

Check Terms
    Click Checkbox        xpath=/html/body/div/div/div[2]/div/form/input[@type='checkbox']

Do Not Check Terms
    Unselect Checkbox    xpath=/html/body/div/div/div[2]/div/form/input[@type='checkbox']

Submit The Form
    Click Button    xpath=/html/body/div/div/div[2]/div/form/button

Verify Successful Submission
    Wait Until Page Contains    Cadastro realizado com sucesso!

Verify Error Message
    [Arguments]    ${error_message}
    Wait Until Page Contains    ${error_message}
# ```

# ### Explanation:
# - **Variables:** Variables are used for storing common values such as URLs, browser type, valid and invalid example data.
# - **Test Cases:** Different test cases are created to validate each scenario provided in the user stories. These include successful registration, as well as specific validations for name, surname, email confirmation, password, and terms checkbox.
# - **Keywords:** Reusable actions such as opening the browser, filling in the form fields, checking checkboxes, submitting the form, and verifying messages are defined under keywords.
# - **Selectors:** XPath selectors are used based on the provided JSON objects to locate form elements. Make sure these paths match the structure of your actual HTML.

# This script handles each scenario clearly and helps to ensure that the application behaves as expected under various input conditions. You might need to refine XPath selectors based on the actual HTML structure of your application.