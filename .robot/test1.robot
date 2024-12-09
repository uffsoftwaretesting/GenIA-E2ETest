To create an E2E test script using the Robot Framework with Selenium and Python, you can leverage the following setup. This script will perform actions on the specified sign-up page, validate form submissions with both valid and invalid data, and check for the appropriate success or error messages.

### Prerequisites:
- Ensure that you have Python, Robot Framework, and Selenium installed.
- You can install necessary libraries using pip:
  ```bash
  pip install robotframework
  pip install robotframework-selenium2library
  pip install robotframework-seleniumlibrary
  pip install selenium
  ```

### Robot Framework Test Script:
Here's a sample test script written in Robot Framework syntax:

```robot
*** Settings ***
Documentation    Test suite for Sign-Up page validation
Library          SeleniumLibrary

*** Variables ***
${URL}           http://localhost:5173/SignUp
${BROWSER}       Chrome
${INPUT_NAME}                           /html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[@id='input_nome']
${INPUT_SURNAME}                       /html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[2]

${INPUT_EMAIL}                         /html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[@id='input_email']

${INPUT_CONFIRM_EMAIL}                 /html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[@id='input_confirmar_email']

${INPUT_PASSWORD}                      /html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[@id='input_senha']

${INPUT_CONFIRM_PASSWORD}              /html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/input[@id='input_confirmar_senha']

${BUTTON_SIGNUP}                       /html/body/div[@id='root']/div/div[@class='_sign_up0_1g5mh_1']/div[@class='_sign_up_1g5mh_1']/form/button[@id='submit_form']

${SUCCESS_MESSAGE}  Cadastro realizado com sucesso!
${ERROR_NAME}   Nome deve ter entre 2 e 50 caracteres.
${ERROR_EMAIL}  Os e-mails não coincidem.
${ERROR_PASSWORD}  A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula e um número.
${ERROR_TERMS}  Você deve aceitar os termos de uso.

*** Test Cases ***
Test Valid Signup
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Input Text    xpath:${INPUT_NAME}    Maria
    Input Text    xpath:${INPUT_SURNAME}    Silva
    Input Text    xpath:${INPUT_EMAIL}    maria@example.com
    Input Text    xpath:${INPUT_CONFIRM_EMAIL}    maria@example.com
    Input Text    xpath:${INPUT_PASSWORD}    Senha123
    Input Text    xpath:${INPUT_CONFIRM_PASSWORD}    Senha123
    Click Element    xpath:${BUTTON_SIGNUP}
    Page Should Contain    ${SUCCESS_MESSAGE}
    [Teardown]    Close Browser

Test Invalid Name
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Input Text    xpath:${INPUT_NAME}    M
    Input Text    xpath:${INPUT_SURNAME}    Silva
    Input Text    xpath:${INPUT_EMAIL}    maria@example.com
    Input Text    xpath:${INPUT_CONFIRM_EMAIL}    maria@example.com
    Input Text    xpath:${INPUT_PASSWORD}    Senha123
    Input Text    xpath:${INPUT_CONFIRM_PASSWORD}    Senha123
    Click Element    xpath:${BUTTON_SIGNUP}
    Page Should Contain    ${ERROR_NAME}
    [Teardown]    Close Browser

Test Email Mismatch
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Input Text    xpath:${INPUT_NAME}    Maria
    Input Text    xpath:${INPUT_SURNAME}    Silva
    Input Text    xpath:${INPUT_EMAIL}    maria@example.com
    Input Text    xpath:${INPUT_CONFIRM_EMAIL}    other@example.com
    Input Text    xpath:${INPUT_PASSWORD}    Senha123
    Input Text    xpath:${INPUT_CONFIRM_PASSWORD}    Senha123
    Click Element    xpath:${BUTTON_SIGNUP}
    Page Should Contain    ${ERROR_EMAIL}
    [Teardown]    Close Browser

Test Weak Password
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Input Text    xpath:${INPUT_NAME}    Maria
    Input Text    xpath:${INPUT_SURNAME}    Silva
    Input Text    xpath:${INPUT_EMAIL}    maria@example.com
    Input Text    xpath:${INPUT_CONFIRM_EMAIL}    maria@example.com
    Input Text    xpath:${INPUT_PASSWORD}    senha123
    Input Text    xpath:${INPUT_CONFIRM_PASSWORD}    senha123
    Click Element    xpath:${BUTTON_SIGNUP}
    Page Should Contain    ${ERROR_PASSWORD}
    [Teardown]    Close Browser
# ```

# ### Explanation:
# - **Setup**: The script sets up environment variables for URLs and XPath identifiers for each field and form element.
# - **Test Cases**:
#   - Each test case opens the browser, fills the form, submits it, and checks for specific messages.
#   - **`Test Valid Signup`**: Fills in the form with valid data and expects a success message.
#   - **`Test Invalid Name`**: Tests validation for names that are too short.
#   - **`Test Email Mismatch`**: Checks behavior when emails do not match.
#   - **`Test Weak Password`**: Checks validation for weak passwords.
# - **Teardown**: Each test case ensures the browser closes after execution.

# This script assumes your local setup is correctly configured and the referenced identifiers are precise to work with the given HTML structure. Adjust the XPaths and verify field attributes as necessary based on the actual implementation on your test site.